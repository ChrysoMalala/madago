from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from datetime import datetime, timedelta
from django.utils import timezone

from conducteurs.models import HistoriqueAction
from .models import Trajet, Siege, PointArret
from .serializers import TrajetSerializer, SiegeSerializer, PointArretSerializer


# ============================================================
# ESTIMATION DE LA DURÉE D'UN TRAJET
# ============================================================
# Ces vitesses servent uniquement à fournir une estimation.
# Elles ne représentent pas une vitesse imposée au conducteur.
VITESSE_MIN_KMH = 30
VITESSE_MOYENNE_KMH = 55
VITESSE_MAX_KMH = 80


def calculer_durees_trajet(distance_km):
    """
    Calcule les durées estimées à partir de la distance.

    - 80 km/h : durée la plus courte estimée
    - 55 km/h : durée moyenne de référence du système
    - 30 km/h : durée la plus longue estimée

    Retourne les durées en minutes ainsi que le texte destiné à
    l'affichage dans l'interface.
    """
    distance_km = float(distance_km)

    duree_min_minutes = round((distance_km / VITESSE_MAX_KMH) * 60)
    duree_moyenne_minutes = round((distance_km / VITESSE_MOYENNE_KMH) * 60)
    duree_max_minutes = round((distance_km / VITESSE_MIN_KMH) * 60)

    return {
        'duree_min_minutes': duree_min_minutes,
        'duree_moyenne_minutes': duree_moyenne_minutes,
        'duree_max_minutes': duree_max_minutes,
        'duree_affichage': (
            f"Environ {_formater_duree(duree_moyenne_minutes)} "
            f"(entre {_formater_duree(duree_min_minutes)} et "
            f"{_formater_duree(duree_max_minutes)})"
        )
    }


def _formater_duree(total_minutes):
    """Transforme un nombre de minutes en texte lisible."""
    heures = total_minutes // 60
    minutes = total_minutes % 60

    if heures and minutes:
        return f"{heures} h {minutes:02d}"
    if heures:
        return f"{heures} h"
    return f"{minutes} min"


# ============================================================
# LISTE DES TRAJETS
# ============================================================

@api_view(['GET'])
@permission_classes([AllowAny])
def liste_trajets(request):
    trajets = Trajet.objects.filter(statut='a_venir')

    ville_depart = request.query_params.get('depart')
    ville_arrivee = request.query_params.get('arrivee')
    date = request.query_params.get('date')

    if ville_depart:
        trajets = trajets.filter(
            ville_depart__icontains=ville_depart
        )

    if ville_arrivee:
        trajets = trajets.filter(
            ville_arrivee__icontains=ville_arrivee
        )

    if date:
        trajets = trajets.filter(
            date_depart=date
        )

    serializer = TrajetSerializer(
        trajets,
        many=True,
        context={'request': request}
    )

    return Response(serializer.data)


# ============================================================
# PUBLIER UN TRAJET
# ============================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def publier_trajet(request):
    from datetime import datetime, timedelta
    from django.utils import timezone
    from .utils import verifier_compatibilite_trajets, geocoder_ville

    try:
        conducteur = request.user.profil_conducteur
    except Exception:
        return Response(
            {'erreur': 'Profil conducteur requis'},
            status=status.HTTP_403_FORBIDDEN
        )

    if conducteur.statut_validation != 'valide':
        return Response(
            {'erreur': 'Votre dossier conducteur doit être validé.'},
            status=status.HTTP_403_FORBIDDEN
        )

    date_depart_str  = request.data.get('date_depart')
    heure_depart_str = request.data.get('heure_depart')
    distance_km      = int(request.data.get('distance_km', 0))
    ville_depart     = request.data.get('ville_depart', '')
    ville_arrivee    = request.data.get('ville_arrivee', '')
    vehicule_id      = request.data.get('vehicule')

    # ── Le véhicule doit être validé pour pouvoir publier un trajet ─
    # Un véhicule en attente, expiré, suspendu ou rejeté ne peut pas
    # être utilisé, même si le conducteur lui-même est validé.
    from vehicules.models import Vehicule
    try:
        vehicule_selectionne = Vehicule.objects.get(pk=vehicule_id, conducteur=conducteur)
    except Vehicule.DoesNotExist:
        return Response(
            {'erreur': 'Véhicule introuvable ou ne vous appartenant pas'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if vehicule_selectionne.statut_validation != 'valide':
        libelles_statut = {
            'en_attente': 'en attente de validation',
            'expire': 'expiré (documents à mettre à jour)',
            'suspendu': 'suspendu',
            'rejete': 'rejeté',
        }
        raison = libelles_statut.get(
            vehicule_selectionne.statut_validation,
            vehicule_selectionne.statut_validation
        )
        return Response(
            {'erreur': f"Ce véhicule est {raison} et ne peut pas être utilisé pour publier un trajet."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # ── Le trajet ne doit pas commencer à/après la date d'expiration ─
    # Un véhicule peut être "valide" AUJOURD'HUI (le cron quotidien
    # ne l'a pas encore basculé en "expire"), mais si le trajet est
    # programmé pour une date future à/après l'expiration de
    # l'assurance ou de la visite technique, il ne pourra de toute
    # façon plus circuler légalement à ce moment-là. On refuse donc
    # la publication dès maintenant, plutôt que de laisser le cron
    # annuler la situation plus tard.
    try:
        date_trajet = datetime.strptime(date_depart_str, '%Y-%m-%d').date()
    except (ValueError, TypeError):
        date_trajet = None

    if date_trajet:
        if date_trajet >= vehicule_selectionne.date_expiration_assurance:
            return Response(
                {'erreur': (
                    f"L'assurance de ce véhicule expire le "
                    f"{vehicule_selectionne.date_expiration_assurance.strftime('%d/%m/%Y')}, "
                    f"avant ou le jour même du trajet prévu. "
                    f"Veuillez renouveler l'assurance avant de publier ce trajet."
                )},
                status=status.HTTP_400_BAD_REQUEST
            )
        if date_trajet >= vehicule_selectionne.date_expiration_visite:
            return Response(
                {'erreur': (
                    f"La visite technique de ce véhicule expire le "
                    f"{vehicule_selectionne.date_expiration_visite.strftime('%d/%m/%Y')}, "
                    f"avant ou le jour même du trajet prévu. "
                    f"Veuillez renouveler la visite technique avant de publier ce trajet."
                )},
                status=status.HTTP_400_BAD_REQUEST
            )

    # ── Distance minimale ─────────────────────────────────────────
    if distance_km < 40:
        return Response(
            {'erreur': f'Distance minimale : 40 km. Actuelle : {distance_km} km.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # ── Estimation de la durée du trajet ─────────────────────────
    # La durée est calculée à partir de la distance :
    # 80 km/h = estimation rapide
    # 55 km/h = vitesse moyenne de référence pour la confirmation de fin
    # 30 km/h = estimation lente
    estimation_duree = calculer_durees_trajet(distance_km)
    duree_estimee_affichage = estimation_duree['duree_affichage']

    # ── Fenêtre de publication ────────────────────────────────────
    for fmt in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M'):
        try:
            depart_dt = timezone.make_aware(
                datetime.strptime(f"{date_depart_str} {heure_depart_str}", fmt)
            )
            break
        except ValueError:
            continue

    maintenant = timezone.now()
    if depart_dt > maintenant + timedelta(days=30):
        return Response(
            {'erreur': 'Impossible de publier plus de 30 jours à l\'avance.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    if depart_dt < maintenant + timedelta(hours=2):
        return Response(
            {'erreur': 'Le trajet doit être publié au moins 2h avant le départ.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # ── Géocodage des villes ──────────────────────────────────────
    # Si le géocodage échoue, on n'empêche PAS la publication : on
    # publie quand même le trajet mais on prévient l'utilisateur que
    # la précision du contrôle de compatibilité sera réduite tant que
    # les coordonnées ne sont pas résolues (le fallback prudent dans
    # utils.py prend le relais pour la sécurité du contrôle).
    avertissements = []

    lat_dep = request.data.get('lat_depart')
    lon_dep = request.data.get('lon_depart')
    lat_arr = request.data.get('lat_arrivee')
    lon_arr = request.data.get('lon_arrivee')

    if not lat_dep or not lon_dep:
        lat_dep, lon_dep = geocoder_ville(ville_depart)
        if lat_dep is None or lon_dep is None:
            avertissements.append(
                f"Impossible de localiser précisément « {ville_depart} ». "
                f"Le contrôle de compatibilité utilisera une estimation "
                f"moins précise pour ce point de départ."
            )

    if not lat_arr or not lon_arr:
        lat_arr, lon_arr = geocoder_ville(ville_arrivee)
        if lat_arr is None or lon_arr is None:
            avertissements.append(
                f"Impossible de localiser précisément « {ville_arrivee} ». "
                f"Le contrôle de compatibilité utilisera une estimation "
                f"moins précise pour ce point d'arrivée."
            )

    # ── Vérification compatibilité ────────────────────────────────
    resultat = verifier_compatibilite_trajets(conducteur, {
        'date_depart':   date_depart_str,
        'heure_depart':  heure_depart_str,
        'distance_km':   distance_km,
        'vehicule_id':   vehicule_id,
        'ville_depart':  ville_depart,
        'ville_arrivee': ville_arrivee,
        'lat_depart':    lat_dep,
        'lon_depart':    lon_dep,
        'lat_arrivee':   lat_arr,
        'lon_arrivee':   lon_arr,
    })

    if not resultat['compatible']:
        return Response(
            {'erreur': resultat['message']},
            status=status.HTTP_400_BAD_REQUEST
        )

    # ── Création du trajet ────────────────────────────────────────
    serializer = TrajetSerializer(data=request.data)
    if serializer.is_valid():
        trajet = serializer.save(
            conducteur=conducteur,
            lat_depart=lat_dep,
            lon_depart=lon_dep,
            lat_arrivee=lat_arr,
            lon_arrivee=lon_arr,
            duree_estimee=duree_estimee_affichage,
        )

        # ── Plan des sièges ───────────────────────────────────────
        plan_sieges = request.data.get('plan_sieges', None)
        if plan_sieges:
            import json
            if isinstance(plan_sieges, str):
                plan_sieges = json.loads(plan_sieges)
            for siege_data in plan_sieges:
                if siege_data.get('zone') == 'plan':
                    Siege.objects.create(
                        trajet=trajet,
                        numero_siege=siege_data.get('numero', 0),
                        prix=trajet.prix_unique or 0,
                        pos_x=siege_data.get('pos_x', 0),
                        pos_y=siege_data.get('pos_y', 0),
                        est_chauffeur=siege_data.get('estChauffeur', False),
                        statut='indisponible' if siege_data.get('estChauffeur') else 'disponible',
                    )
        else:
            vehicule = trajet.vehicule
            for i in range(1, vehicule.nombre_places + 1):
                Siege.objects.create(
                    trajet=trajet,
                    numero_siege=i,
                    prix=trajet.prix_unique or 0
                )

        reponse = {
            'message': 'Trajet publié avec succès',
            'duree_estimee': duree_estimee_affichage,
            'estimation_duree': {
                'vitesse_min_kmh': VITESSE_MIN_KMH,
                'vitesse_moyenne_kmh': VITESSE_MOYENNE_KMH,
                'vitesse_max_kmh': VITESSE_MAX_KMH,
                'duree_min': _formater_duree(estimation_duree['duree_min_minutes']),
                'duree_moyenne': _formater_duree(estimation_duree['duree_moyenne_minutes']),
                'duree_max': _formater_duree(estimation_duree['duree_max_minutes']),
            },
            'trajet': TrajetSerializer(trajet, context={'request': request}).data
        }
        if avertissements:
            reponse['avertissements'] = avertissements

        return Response(reponse, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ============================================================
# DETAIL D'UN TRAJET
# ============================================================

@api_view(['GET'])
@permission_classes([AllowAny])
def detail_trajet(request, pk):

    try:
        trajet = Trajet.objects.get(
            pk=pk
        )

        return Response(
            TrajetSerializer(trajet, context={'request': request}).data
        )

    except Trajet.DoesNotExist:
        return Response(
            {
                'erreur': 'Trajet introuvable'
            },
            status=status.HTTP_404_NOT_FOUND
        )


# ============================================================
# MES TRAJETS
# ============================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mes_trajets(request):

    try:
        conducteur = request.user.profil_conducteur

        statut = request.query_params.get(
            'statut'
        )

        trajets = Trajet.objects.filter(
            conducteur=conducteur
        )

        if statut:
            trajets = trajets.filter(
                statut=statut
            )

        return Response(
            TrajetSerializer(
                trajets,
                many=True,
                context={'request': request}
            ).data
        )

    except Exception:
        return Response(
            {
                'erreur': 'Profil conducteur requis'
            },
            status=status.HTTP_403_FORBIDDEN
        )


# ============================================================
# SUPPRIMER UN TRAJET
# ============================================================

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def supprimer_trajet(request, pk):

    try:
        conducteur = request.user.profil_conducteur

    except Exception:
        return Response(
            {
                'erreur': 'Profil conducteur requis'
            },
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        trajet = Trajet.objects.get(
            pk=pk,
            conducteur=conducteur
        )

    except Trajet.DoesNotExist:
        return Response(
            {
                'erreur': 'Trajet introuvable'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    trajet.delete()

    return Response(
        {
            'message': 'Trajet supprimé avec succès'
        },
        status=status.HTTP_204_NO_CONTENT
    )


# ============================================================
# CONFIRMER LE DEPART
# ============================================================

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def confirmer_depart(request, pk):

    from django.utils import timezone
    from datetime import datetime
    from reservations.models import Reservation

    try:
        conducteur = request.user.profil_conducteur

        trajet = Trajet.objects.get(
            pk=pk,
            conducteur=conducteur
        )

    except Trajet.DoesNotExist:
        return Response(
            {
                'erreur': 'Trajet introuvable'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    except Exception:
        return Response(
            {
                'erreur': 'Profil conducteur requis'
            },
            status=status.HTTP_403_FORBIDDEN
        )

    # ── Vérification statut ─────────────────────────────────
    if trajet.statut != 'a_venir':
        return Response(
            {
                'erreur': (
                    'Ce trajet doit être "à venir" '
                    'pour confirmer le départ'
                )
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # ── Vérification horaire ─────────────────────────────────
    maintenant = timezone.localtime(
        timezone.now()
    )

    heure_depart_prevue = timezone.make_aware(
        datetime.combine(
            trajet.date_depart,
            trajet.heure_depart
        )
    )
    print("======================================")
    print("HEURE SERVEUR :", maintenant)
    print("HEURE DEPART :", heure_depart_prevue)
    print("======================================")

    # Avant l'heure prévue
    if maintenant < heure_depart_prevue:

        heure_formatee = (
            trajet.heure_depart.strftime('%H:%M')
        )

        return Response(
            {
                'erreur': (
                    'La confirmation du départ sera '
                    f'disponible à partir de {heure_formatee}.'
                )
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # ── Passage en cours ─────────────────────────────────────
    trajet.statut = 'en_cours'
    trajet.heure_depart_reelle = timezone.now()
    trajet.save()

    # ── Transfert de revenus simulé ──────────────────────────
    # On ne filtre plus uniquement sur statut='confirmee' : une
    # réservation "en retard" (marquée par le conducteur, remboursée
    # à 50% au passager) doit quand même transférer sa part au
    # conducteur, même si son statut est passé à "remboursee". Seul
    # ce qui compte vraiment ici est l'état du PAIEMENT : s'il est
    # encore "en_attente", il reste dû (qu'il s'agisse d'un montant
    # complet ou d'une part réduite à 50%) ; s'il est déjà
    # "rembourse" (annulation >1h à l'avance), rien n'est dû au
    # conducteur pour cette place.
    reservations = Reservation.objects.filter(
        trajet=trajet,
    ).select_related('paiement')

    montant_total_transfere = 0

    for reservation in reservations:

        if (
            hasattr(reservation, 'paiement')
            and reservation.paiement.statut_escrow == 'en_attente'
        ):
            reservation.paiement.statut_escrow = 'verse'
            reservation.paiement.date_versement = (
                timezone.now()
            )
            reservation.paiement.save()

            montant_total_transfere += float(
                reservation.paiement.montant_conducteur
            )

    # ── Historique ────────────────────────────────────────────
    HistoriqueAction.objects.create(
        action='confirmation_depart',
        conducteur=conducteur,
        admin=None,
        description=(
            f"Départ confirmé : "
            f"{trajet.ville_depart} → "
            f"{trajet.ville_arrivee} "
            f"le {trajet.date_depart}"
        ),
    )

    if montant_total_transfere > 0:

        HistoriqueAction.objects.create(
            action='transfert_revenus',
            conducteur=conducteur,
            admin=None,
            description=(
                f"Transfert simulé de "
                f"{montant_total_transfere:,.0f} Ar "
                f"vers "
                f"{conducteur.operateur_mobile_money} "
                f"({conducteur.numero_mobile_money})"
            ),
            montant=montant_total_transfere,
        )

    # ── Notification conducteur ──────────────────────────────
    try:
        from notifications.models import Notification

        Notification.objects.create(
            utilisateur=conducteur.utilisateur,
            type_notification='trajet_depart_confirme',
            titre=(
                f"Départ confirmé — "
                f"{trajet.ville_depart} → "
                f"{trajet.ville_arrivee}"
            ),
            message=(
                f"Votre trajet du {trajet.date_depart} "
                f"a démarré. "
                f"Montant transféré : "
                f"{montant_total_transfere:,.0f} Ar "
                f"(simulation)."
            ),
        )

    except Exception:
        pass

    return Response(
        {
            'message': (
                'Départ confirmé — revenus transférés '
                '(simulation)'
            ),
            'montant_transfere': (
                montant_total_transfere
            ),
            'trajet': TrajetSerializer(
                trajet,
                context={'request': request}
            ).data
        }
    )


# ============================================================
# CONFIRMER LA FIN DU TRAJET
# ============================================================

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def confirmer_fin_trajet(request, pk):

    try:
        conducteur = request.user.profil_conducteur

        trajet = Trajet.objects.get(
            pk=pk,
            conducteur=conducteur
        )

    except Trajet.DoesNotExist:
        return Response(
            {
                'erreur': 'Trajet introuvable'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    except Exception:
        return Response(
            {
                'erreur': 'Profil conducteur requis'
            },
            status=status.HTTP_403_FORBIDDEN
        )

    # ── Vérification statut ─────────────────────────────────
    if trajet.statut != 'en_cours':
        return Response(
            {
                'erreur': (
                    'Le trajet doit être "en cours" '
                    'pour confirmer sa fin'
                )
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # ── Vérification de la durée estimée ────────────────────────
    # La confirmation de fin ne peut pas être faite immédiatement
    # après le départ. On utilise l'heure réelle de départ et la
    # vitesse moyenne de référence de 55 km/h.
    if not trajet.heure_depart_reelle:
        return Response(
            {
                'erreur': (
                    'L’heure réelle de départ est introuvable. '
                    'Veuillez d’abord confirmer le départ du trajet.'
                )
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    estimation_duree = calculer_durees_trajet(trajet.distance_km)
    duree_moyenne_minutes = estimation_duree['duree_moyenne_minutes']

    heure_depart_reelle = trajet.heure_depart_reelle
    heure_fin_minimale = (
        heure_depart_reelle
        + timedelta(minutes=duree_moyenne_minutes)
    )

    maintenant = timezone.now()

    if maintenant < heure_fin_minimale:
        heure_disponible = timezone.localtime(
            heure_fin_minimale
        ).strftime('%d/%m/%Y à %H:%M')

        return Response(
            {
                'erreur': (
                    'La confirmation de fin du trajet est encore trop tôt. '
                    f'La durée moyenne estimée est de '
                    f'{_formater_duree(duree_moyenne_minutes)}. '
                    f'Vous pourrez confirmer la fin à partir du '
                    f'{heure_disponible}.'
                ),
                'duree_estimee': estimation_duree['duree_affichage'],
                'duree_moyenne': _formater_duree(duree_moyenne_minutes),
                'confirmation_fin_disponible_a': heure_fin_minimale,
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # ── Passage à terminé ────────────────────────────────────
    trajet.statut = 'termine'
    trajet.heure_arrivee_reelle = maintenant
    trajet.save()

    # ── Historique ────────────────────────────────────────────
    HistoriqueAction.objects.create(
        action='confirmation_fin',
        conducteur=conducteur,
        admin=None,
        description=(
            f"Fin de trajet confirmée : "
            f"{trajet.ville_depart} → "
            f"{trajet.ville_arrivee} "
            f"le {trajet.date_depart}"
        ),
    )

    return Response(
        {
            'message': 'Trajet terminé avec succès',
            'trajet': TrajetSerializer(
                trajet,
                context={'request': request}
            ).data
        }
    )


# ============================================================
# AJOUTER UN POINT D'ARRET
# ============================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ajouter_point_arret(request, pk):

    try:
        conducteur = request.user.profil_conducteur

        trajet = Trajet.objects.get(
            pk=pk,
            conducteur=conducteur
        )

    except Trajet.DoesNotExist:
        return Response(
            {
                'erreur': 'Trajet introuvable'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    except Exception:
        return Response(
            {
                'erreur': 'Profil conducteur requis'
            },
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = PointArretSerializer(
        data=request.data
    )

    if serializer.is_valid():

        serializer.save(
            trajet=trajet
        )

        return Response(
            {
                'message': (
                    "Point d'arrêt ajouté avec succès"
                ),
                'point_arret': serializer.data
            },
            status=status.HTTP_201_CREATED
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )


# ============================================================
# VERIFIER UNE RESERVATION
# ============================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verifier_reservation(request, pk):
    """
    Vérifie si l'utilisateur connecté peut réserver ce trajet.
    Retourne :
    {
        "peut_reserver": bool,
        "raison": str
    }
    """

    from reservations.models import Reservation

    try:
        trajet = Trajet.objects.get(
            pk=pk
        )

    except Trajet.DoesNotExist:
        return Response(
            {
                'peut_reserver': False,
                'raison': 'Trajet introuvable.'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    utilisateur = request.user

    # ── Règle 1 : trajet annulé ──────────────────────────────
    if trajet.statut == 'annule':
        return Response(
            {
                'peut_reserver': False,
                'raison': (
                    'Ce trajet a été annulé.'
                )
            }
        )

    # ── Règle 2 : terminé ou en cours ────────────────────────
    if trajet.statut in [
        'termine',
        'en_cours'
    ]:
        return Response(
            {
                'peut_reserver': False,
                'raison': (
                    'Les réservations pour ce trajet '
                    'sont closes.'
                )
            }
        )

    # ── Règle 3 : trajet complet ─────────────────────────────
    sieges_disponibles = Siege.objects.filter(
        trajet=trajet,
        statut='disponible',
        est_chauffeur=False
    ).count()

    if sieges_disponibles == 0:
        return Response(
            {
                'peut_reserver': False,
                'raison': (
                    'Ce trajet est complet. '
                    'Aucune place disponible.'
                )
            }
        )

    # ── Règle 4 : conducteur de ce trajet ────────────────────
    try:
        profil_conducteur = (
            utilisateur.profil_conducteur
        )

        if trajet.conducteur == profil_conducteur:
            return Response(
                {
                    'peut_reserver': False,
                    'raison': (
                        'Vous êtes le conducteur de ce trajet. '
                        'Vous ne pouvez pas réserver votre '
                        'propre trajet.'
                    )
                }
            )

        # NOTE : la règle précédente (qui bloquait toute réservation
        # d'un trajet le même jour qu'un trajet publié par ce même
        # utilisateur en tant que conducteur, même sans chevauchement
        # horaire réel) a été retirée à la demande explicite du
        # porteur du projet : un compte conducteur+passager doit
        # pouvoir réserver librement, comme n'importe quel passager.

    except Exception:
        # Pas un conducteur → on continue
        pass

    # ── Tout est OK ──────────────────────────────────────────
    # NOTE : deux règles ont été retirées ici, pour rendre les
    # réservations totalement libres pour un compte passager :
    # 1) l'ancienne règle qui bloquait une deuxième réservation sur
    #    LE MÊME trajet ("Vous avez déjà une réservation confirmée
    #    sur ce trajet") — retirée car un compte doit pouvoir
    #    réserver plusieurs places sur un même trajet (plusieurs
    #    personnes du même groupe, par exemple) ;
    # 2) la règle qui refusait toute réservation d'un passager sur
    #    un autre trajet ayant exactement les mêmes date/heure de
    #    départ — retirée pour la même raison que la suppression
    #    faite dans reservations/views.py.
    # Les seules limites qui restent sont légitimes et gérées plus
    # haut dans cette fonction : trajet annulé/terminé, trajet
    # complet, et le fait de ne pas pouvoir réserver son propre
    # trajet en tant que conducteur.
    return Response(
        {
            'peut_reserver': True,
            'raison': ''
        }
    )


# ============================================================
# TRAJETS D'UN CONDUCTEUR - ADMIN
# ============================================================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def trajets_conducteur_admin(
    request,
    conducteur_id
):

    trajets = Trajet.objects.filter(
        conducteur_id=conducteur_id
    ).order_by(
        '-date_depart'
    )

    return Response(
        TrajetSerializer(
            trajets,
            many=True,
            context={'request': request}
        ).data
    )


# ============================================================
# VERIFIER CONFLIT TRAJET
# ============================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verifier_conflit_trajet(request):
    """
    Vérification préalable depuis le frontend.
    """
    from datetime import datetime
    from .utils import verifier_compatibilite_trajets, geocoder_ville

    try:
        conducteur = request.user.profil_conducteur
    except Exception:
        return Response({'erreur': 'Profil conducteur requis'}, status=403)

    date_depart  = request.data.get('date_depart')
    heure_depart = request.data.get('heure_depart')
    distance_km  = request.data.get('distance_km')
    vehicule_id  = request.data.get('vehicule')
    ville_depart = request.data.get('ville_depart', '')
    ville_arrivee = request.data.get('ville_arrivee', '')
    lat_depart   = request.data.get('lat_depart')
    lon_depart   = request.data.get('lon_depart')
    lat_arrivee  = request.data.get('lat_arrivee')
    lon_arrivee  = request.data.get('lon_arrivee')

    if not all([date_depart, heure_depart, distance_km, vehicule_id]):
        return Response({'compatible': True, 'message': ''})

    # ── Même contrôle véhicule que dans publier_trajet ──────────────
    # (statut + expiration à la date du trajet), pour que le frontend
    # puisse avertir l'utilisateur AVANT qu'il n'aille au bout du
    # formulaire de publication.
    from vehicules.models import Vehicule
    try:
        vehicule_selectionne = Vehicule.objects.get(pk=vehicule_id, conducteur=conducteur)
    except Vehicule.DoesNotExist:
        return Response({
            'compatible': False,
            'message': 'Véhicule introuvable ou ne vous appartenant pas.'
        })

    if vehicule_selectionne.statut_validation != 'valide':
        libelles_statut = {
            'en_attente': 'en attente de validation',
            'expire': 'expiré (documents à mettre à jour)',
            'suspendu': 'suspendu',
            'rejete': 'rejeté',
        }
        raison = libelles_statut.get(
            vehicule_selectionne.statut_validation,
            vehicule_selectionne.statut_validation
        )
        return Response({
            'compatible': False,
            'message': f"Ce véhicule est {raison} et ne peut pas être utilisé pour publier un trajet."
        })

    try:
        date_trajet = datetime.strptime(date_depart, '%Y-%m-%d').date()
    except (ValueError, TypeError):
        date_trajet = None

    if date_trajet:
        if date_trajet >= vehicule_selectionne.date_expiration_assurance:
            return Response({
                'compatible': False,
                'message': (
                    f"L'assurance de ce véhicule expire le "
                    f"{vehicule_selectionne.date_expiration_assurance.strftime('%d/%m/%Y')}, "
                    f"avant ou le jour même du trajet prévu."
                )
            })
        if date_trajet >= vehicule_selectionne.date_expiration_visite:
            return Response({
                'compatible': False,
                'message': (
                    f"La visite technique de ce véhicule expire le "
                    f"{vehicule_selectionne.date_expiration_visite.strftime('%d/%m/%Y')}, "
                    f"avant ou le jour même du trajet prévu."
                )
            })

    # Géocoder si coordonnées manquantes
    if not lat_depart or not lon_depart:
        lat_depart, lon_depart = geocoder_ville(ville_depart)
    if not lat_arrivee or not lon_arrivee:
        lat_arrivee, lon_arrivee = geocoder_ville(ville_arrivee)

    resultat = verifier_compatibilite_trajets(conducteur, {
        'date_depart':  date_depart,
        'heure_depart': heure_depart,
        'distance_km':  distance_km,
        'vehicule_id':  vehicule_id,
        'ville_depart':  ville_depart,
        'ville_arrivee': ville_arrivee,
        'lat_depart':   lat_depart,
        'lon_depart':   lon_depart,
        'lat_arrivee':  lat_arrivee,
        'lon_arrivee':  lon_arrivee,
    })

    return Response(resultat)