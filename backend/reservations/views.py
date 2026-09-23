from datetime import datetime, timedelta
from decimal import Decimal

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.http import FileResponse
from django.utils import timezone

from .models import Reservation, Paiement
from .serializers import ReservationSerializer
from .billets import generer_pdf_billet, generer_pdf_billet_groupe
from trajets.models import Siege, Trajet


def _fenetre_depart(trajet):
    """
    Retourne le datetime de départ d'un trajet (sans les infos de
    fuseau horaire de Django, pour rester cohérent avec le reste du
    calcul déjà fait ailleurs dans ce fichier). Retourne None si le
    format n'a pas pu être interprété.
    """
    for fmt in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M'):
        try:
            return datetime.strptime(
                f"{trajet.date_depart} {trajet.heure_depart}", fmt
            )
        except ValueError:
            continue
    return None


def _appliquer_taux_conducteur(reservation, taux_conserve):
    """
    Recalcule le Paiement lié à une réservation selon le pourcentage
    du prix effectivement conservé par la plateforme (donc dû au
    conducteur, une fois la commission déduite) :

    - taux_conserve = 100 : situation normale (passager présent, ou
      réservation qui n'a jamais donné lieu à un remboursement) —
      le conducteur touche sa part sur la totalité du prix.
    - taux_conserve = 50  : annulation tardive (<1h avant le départ)
      ou absence du passager — le conducteur touche sa part
      uniquement sur la moitié conservée.
    - taux_conserve = 0   : annulation largement à l'avance (>1h) —
      remboursement quasi-total au passager, le conducteur ne touche
      rien sur cette place.

    Ne stocke PAS de champ dédié : on réutilise commission_montant
    et montant_conducteur, déjà prévus pour ça dans le modèle
    Paiement, en les recalculant à partir de montant_passager (qui
    ne change jamais) et de commission_taux.
    """
    if not hasattr(reservation, 'paiement'):
        return

    paiement = reservation.paiement
    montant_retenu = paiement.montant_passager * Decimal(taux_conserve) / Decimal(100)
    commission = montant_retenu * paiement.commission_taux / Decimal(100)

    paiement.commission_montant = commission
    paiement.montant_conducteur = montant_retenu - commission

    if taux_conserve == 0:
        # Rien n'est dû au conducteur : le remboursement (passager)
        # est traité intégralement tout de suite, rien à transférer
        # plus tard à confirmer_depart pour cette place.
        paiement.statut_escrow = 'rembourse'
    elif paiement.statut_escrow == 'rembourse':
        # On revient en arrière (ex: le conducteur annule un
        # marquage "en retard") : remettre en attente de transfert
        # normal, sauf si le versement a déjà réellement eu lieu.
        paiement.statut_escrow = 'en_attente'

    paiement.save()


def _fenetre_horaire_trajet(trajet):
    """
    Calcule la fenêtre d'occupation estimée d'un trajet (départ → fin
    estimée), en réutilisant exactement la même logique que dans
    trajets/utils.py (duree_estimee_heures), pour garantir que le
    calcul est cohérent partout dans l'application.

    Retourne (depart, fin) sous forme de datetime, ou (None, None) si
    le format de date/heure du trajet n'a pas pu être interprété.
    """
    from trajets.utils import duree_estimee_heures

    for fmt in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M'):
        try:
            depart = datetime.strptime(
                f"{trajet.date_depart} {trajet.heure_depart}", fmt
            )
            break
        except ValueError:
            continue
    else:
        return None, None

    duree = duree_estimee_heures(trajet.distance_km)
    fin = depart + timedelta(hours=duree)
    return depart, fin


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def creer_reservation(request):
    siege_id = request.data.get('siege')
    trajet_id = request.data.get('trajet')
    type_reservation = request.data.get('type_reservation', 'soi_meme')

    try:
        siege = Siege.objects.get(pk=siege_id, statut='disponible')
    except Siege.DoesNotExist:
        return Response(
            {'erreur': 'Siège indisponible'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        trajet = Trajet.objects.get(pk=trajet_id)
    except Trajet.DoesNotExist:
        return Response(
            {'erreur': 'Trajet introuvable'},
            status=status.HTTP_404_NOT_FOUND
        )

    if trajet.statut == 'annule':
        return Response(
            {'erreur': 'Ce trajet a été annulé'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Un conducteur ne peut pas réserver son propre trajet.
    # Cette règle s'applique quel que soit type_reservation : même
    # si c'est "pour une autre personne", cela reviendrait à réserver
    # une place sur son propre trajet publié, ce qui n'a pas de sens
    # (le conducteur gère déjà ses passagers autrement).
    if hasattr(request.user, 'profil_conducteur') and trajet.conducteur_id == request.user.profil_conducteur.id:
        return Response(
            {'erreur': 'Vous ne pouvez pas réserver votre propre trajet'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # ── Conflit d'horaire avec ses propres trajets conduits ────────
    # Ne s'applique QUE si la réservation est pour soi-même : si elle
    # est faite pour une autre personne, ce n'est pas le titulaire du
    # compte qui voyage, donc aucun conflit physique n'est possible.
    #
    # On vérifie un vrai chevauchement horaire (période d'occupation
    # du trajet conduit vs période d'occupation du trajet réservé),
    # et non plus simplement "le même jour" — un conducteur qui roule
    # à 6h du matin doit pouvoir réserver une place à 20h le soir.
    if type_reservation == 'soi_meme' and hasattr(request.user, 'profil_conducteur'):
        nouveau_depart, nouveau_fin = _fenetre_horaire_trajet(trajet)

        if nouveau_depart and nouveau_fin:
            trajets_conduits = Trajet.objects.filter(
                conducteur=request.user.profil_conducteur,
                statut__in=['a_venir', 'en_cours']
            )

            for t in trajets_conduits:
                t_depart, t_fin = _fenetre_horaire_trajet(t)
                if not t_depart:
                    continue

                chevauchement = (nouveau_depart < t_fin and nouveau_fin > t_depart)
                if chevauchement:
                    return Response(
                        {'erreur': (
                            f"Vous conduisez déjà le trajet "
                            f"{t.ville_depart} → {t.ville_arrivee} "
                            f"de {t_depart.strftime('%H:%M')} "
                            f"à {t_fin.strftime('%d/%m %H:%M')}, "
                            f"ce qui chevauche l'horaire du trajet "
                            f"que vous souhaitez réserver."
                        )},
                        status=status.HTTP_400_BAD_REQUEST
                    )

    serializer = ReservationSerializer(data=request.data)
    if serializer.is_valid():
        reservation = serializer.save(
            passager=request.user,
            prix_total=siege.prix
        )
        siege.statut = 'reserve'
        siege.save()

        montant = reservation.prix_total
        commission = montant * 10 / 100
        Paiement.objects.create(
            reservation=reservation,
            montant_passager=montant,
            operateur=request.data.get('operateur', 'mvola'),
            numero_telephone=request.data.get('numero_telephone', ''),
            commission_taux=10,
            commission_montant=commission,
            montant_conducteur=montant - commission,
        )
        return Response({
            'message': 'Réservation confirmée',
            'reservation': ReservationSerializer(reservation).data
        }, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mes_reservations(request):
    reservations = Reservation.objects.filter(passager=request.user)
    return Response(ReservationSerializer(reservations, many=True).data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def annuler_reservation(request, pk):
    try:
        reservation = Reservation.objects.select_related(
            'paiement', 'trajet'
        ).get(pk=pk, passager=request.user)
    except Reservation.DoesNotExist:
        return Response(
            {'erreur': 'Réservation introuvable'},
            status=status.HTTP_404_NOT_FOUND
        )

    if reservation.statut != 'confirmee':
        return Response(
            {'erreur': 'Cette réservation ne peut pas être annulée'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # ── Sécurité supplémentaire : trajet déjà avancé ou terminé ─────
    # Le contrôle horaire ci-dessous suffit dans la majorité des cas,
    # mais si le conducteur a déjà confirmé le départ ou la fin du
    # trajet, l'annulation doit être bloquée même si l'heure stockée
    # ne colle pas exactement à l'heure réelle.
    if reservation.trajet.statut in ('en_cours', 'termine'):
        return Response(
            {'erreur': (
                'Ce trajet a déjà débuté, vous ne pouvez plus annuler '
                'vous-même cette réservation.'
            )},
            status=status.HTTP_400_BAD_REQUEST
        )

    # ── Coupure stricte à l'heure de départ ─────────────────────────
    # Une fois l'heure de départ atteinte, le passager ne peut plus
    # annuler lui-même : c'est au conducteur de gérer sa présence
    # (marquerPassager) via le mécanisme "en retard" / "installé".
    depart = _fenetre_depart(reservation.trajet)
    maintenant = datetime.now()

    if depart and maintenant >= depart:
        return Response(
            {'erreur': (
                "L'heure de départ est atteinte, vous ne pouvez plus "
                "annuler vous-même cette réservation."
            )},
            status=status.HTTP_400_BAD_REQUEST
        )

    # ── Détermine le palier de remboursement ────────────────────────
    # >1h avant le départ  : 100% (moins les frais de transfert,
    #                         gérés uniquement côté affichage frontend)
    #                         → le conducteur ne touche rien (0%)
    # <1h avant le départ  : 50% remboursés au passager
    #                         → le conducteur touche sa part sur
    #                           les 50% restants
    if depart:
        heures_restantes = (depart - maintenant).total_seconds() / 3600
        eligible_100 = heures_restantes > 1
    else:
        # Format de date/heure imparfaitement interprété : on reste
        # prudent et on applique le palier le plus favorable au
        # passager plutôt que de bloquer l'annulation.
        eligible_100 = True

    _appliquer_taux_conducteur(reservation, taux_conserve=0 if eligible_100 else 50)

    # Tout le système de paiement étant simulé (pas de vraie
    # passerelle Mobile Money), le remboursement est considéré
    # comme immédiat dès l'annulation : la réservation passe
    # directement au statut "remboursee" plutôt que de rester sur
    # "annulee" (qui n'est donc plus utilisé comme état terminal —
    # gardé dans STATUT_CHOICES pour compatibilité avec les
    # anciennes données déjà en base).
    reservation.statut = 'remboursee'
    reservation.date_annulation = timezone.now()
    reservation.siege.statut = 'disponible'
    reservation.siege.save()
    reservation.save()

    return Response({
        'message': (
            'Réservation annulée — remboursement à 100% (hors frais de transfert)'
            if eligible_100 else
            "Réservation annulée — remboursement à 50% (annulation à moins d'1h du départ)"
        )
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def telecharger_billet(request, pk):
    """
    Génère et renvoie le billet PDF d'une réservation individuelle.
    Si cette réservation appartient à une commande groupée
    (groupe_reservation renseigné), on redirige automatiquement vers
    le billet groupé complet plutôt que d'afficher un billet partiel
    ne listant qu'un seul siège.
    """
    try:
        reservation = Reservation.objects.select_related(
            'trajet', 'siege', 'point_ramassage', 'point_depose', 'passager'
        ).get(pk=pk, passager=request.user)
    except Reservation.DoesNotExist:
        return Response(
            {'erreur': 'Réservation introuvable'},
            status=status.HTTP_404_NOT_FOUND
        )

    if reservation.groupe_reservation:
        reservations_groupe = list(Reservation.objects.filter(
            groupe_reservation=reservation.groupe_reservation,
            passager=request.user
        ).select_related('trajet', 'siege', 'point_ramassage', 'point_depose', 'passager'))
        buffer = generer_pdf_billet_groupe(reservations_groupe)
        nom_fichier = f"billet_{reservation.groupe_reservation}.pdf"
    else:
        buffer = generer_pdf_billet(reservation)
        nom_fichier = f"billet_{reservation.code_billet}.pdf"

    return FileResponse(
        buffer,
        as_attachment=True,
        filename=nom_fichier,
        content_type='application/pdf'
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def telecharger_billet_groupe(request, code_groupe):
    """
    Génère et renvoie le billet PDF regroupant toutes les
    réservations d'une même commande (identifiée par
    groupe_reservation), listant chaque siège réservé.
    """
    reservations = list(Reservation.objects.filter(
        groupe_reservation=code_groupe,
        passager=request.user
    ).select_related('trajet', 'siege', 'point_ramassage', 'point_depose', 'passager'))

    if not reservations:
        return Response(
            {'erreur': 'Commande introuvable'},
            status=status.HTTP_404_NOT_FOUND
        )

    buffer = generer_pdf_billet_groupe(reservations)

    return FileResponse(
        buffer,
        as_attachment=True,
        filename=f"billet_{code_groupe}.pdf",
        content_type='application/pdf'
    )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def reservations_trajet_admin(request, trajet_id):
    reservations = Reservation.objects.filter(trajet_id=trajet_id)
    return Response(ReservationSerializer(reservations, many=True).data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def marquer_passager(request, trajet_pk, reservation_pk):
    """
    Permet au conducteur de marquer un passager comme :
    - présent à bord (present_a_bord=True)
    - en retard (en_retard=True) -> déclenche automatiquement un
      remboursement à 50% (absence non signalée par le passager
      lui-même), en réutilisant _appliquer_taux_conducteur comme
      pour une annulation classique.
    - "Annuler le retard" (en_retard=False, alors qu'il était True)
      -> revient à un remboursement à 0% : le conducteur touche
      l'intégralité de sa part, comme si le passager n'avait jamais
      été marqué en retard.

    Protection serveur : aucun marquage n'est autorisé avant l'heure
    de départ prévue du trajet. La restriction existait déjà côté
    interface (bouton masqué) ; elle est maintenant imposée ici
    aussi, pour ne pas dépendre uniquement du frontend.
    """
    try:
        conducteur = request.user.profil_conducteur
        trajet = Trajet.objects.get(pk=trajet_pk, conducteur=conducteur)
    except Exception:
        return Response(
            {'erreur': 'Accès non autorisé'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        reservation = Reservation.objects.select_related('paiement').get(
            pk=reservation_pk, trajet=trajet
        )
    except Reservation.DoesNotExist:
        return Response(
            {'erreur': 'Réservation introuvable'},
            status=status.HTTP_404_NOT_FOUND
        )

    # ── Protection serveur : pas de marquage avant le départ ────────
    depart = _fenetre_depart(trajet)
    if depart and datetime.now() < depart:
        return Response(
            {'erreur': (
                "Le marquage des passagers ne sera possible qu'à "
                "partir de l'heure de départ du trajet."
            )},
            status=status.HTTP_400_BAD_REQUEST
        )

    present = request.data.get('present_a_bord', None)
    en_retard = request.data.get('en_retard', None)

    # ── Marquage "en retard" : remboursement automatique à 50% ──────
    if en_retard is True and not reservation.en_retard:
        if reservation.statut != 'confirmee':
            return Response(
                {'erreur': 'Cette réservation ne peut pas être marquée en retard'},
                status=status.HTTP_400_BAD_REQUEST
            )
        reservation.en_retard = True
        reservation.present_a_bord = False
        reservation.statut = 'remboursee'
        reservation.date_annulation = timezone.now()
        _appliquer_taux_conducteur(reservation, taux_conserve=50)

    # ── "Annuler le retard" : retour à 0% remboursé ──────────────────
    elif en_retard is False and reservation.en_retard:
        reservation.en_retard = False
        reservation.statut = 'confirmee'
        reservation.date_annulation = None
        _appliquer_taux_conducteur(reservation, taux_conserve=100)

    # ── Marquage "installé" ──────────────────────────────────────────
    if present is not None:
        if present and reservation.en_retard:
            # Ne devrait pas arriver depuis l'interface actuelle (qui
            # masque la case "Installé" tant que "en retard" est
            # actif), mais on refuse quand même par sécurité côté API.
            return Response(
                {'erreur': (
                    'Annulez d\'abord le marquage "en retard" avant '
                    'de marquer ce passager comme installé.'
                )},
                status=status.HTTP_400_BAD_REQUEST
            )
        reservation.present_a_bord = present

    reservation.save()

    return Response({
        'message': 'Statut passager mis à jour',
        'reservation_id': reservation.id,
        'present_a_bord': reservation.present_a_bord,
        'en_retard': reservation.en_retard,
        'statut': reservation.statut,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def passagers_trajet_conducteur(request, trajet_pk):
    """
    Retourne la liste des passagers d'un trajet pour le conducteur —
    UNE LIGNE PAR RÉSERVATION (par siège), pas par compte.

    Pourquoi pas par compte : un même compte peut réserver plusieurs
    sièges pour des bénéficiaires DIFFÉRENTS sur le même trajet (par
    exemple deux commandes séparées, une pour "Jean Rakoto" et une
    pour "Marie Rasoa"). Regrouper par compte masquerait cette
    distinction. Chaque ligne représente donc un siège, avec :
    - nom / téléphone : ceux du VOYAGEUR réel (bénéficiaire si la
      réservation est faite pour une autre personne, sinon ceux du
      compte)
    - email : toujours celui du COMPTE réservateur (utile pour
      recontacter la personne responsable de la réservation)
    """
    try:
        conducteur = request.user.profil_conducteur
        trajet = Trajet.objects.get(pk=trajet_pk, conducteur=conducteur)
    except Exception:
        return Response(
            {'erreur': 'Accès non autorisé'},
            status=status.HTTP_403_FORBIDDEN
        )

    reservations = Reservation.objects.filter(
        trajet=trajet
    ).select_related('passager', 'siege', 'point_ramassage', 'point_depose').order_by('siege__numero_siege')

    resultat = []
    for r in reservations:
        if r.type_reservation == 'autre_personne' and r.beneficiaire_telephone:
            telephone = r.beneficiaire_telephone
        else:
            telephone = r.passager.telephone

        resultat.append({
            'reservation_id': r.id,
            'nom': r.nom_titulaire(),
            'email': r.passager.email,
            'telephone': telephone,
            'siege': r.siege.numero_siege,
            'montant': r.prix_total,
            'statut': r.statut,
            'present_a_bord': r.present_a_bord,
            'en_retard': r.en_retard,
            'type_reservation': r.type_reservation,
            'groupe_reservation': r.groupe_reservation,
            'code_billet': r.code_billet,
            'point_ramassage': r.point_ramassage.nom_lieu,
            'point_depose': r.point_depose.nom_lieu,
        })

    return Response(resultat)