from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from .models import Conducteur, HistoriqueAction
from django.utils import timezone

from .models import Conducteur
from .serializers import ConducteurSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def devenir_conducteur(request):
    # Vérifier si l'utilisateur est déjà conducteur
    if hasattr(request.user, 'profil_conducteur'):
        return Response({
            'erreur': 'Vous êtes déjà enregistré comme conducteur'
        }, status=status.HTTP_400_BAD_REQUEST)

    serializer = ConducteurSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(utilisateur=request.user)
        return Response({
            'message': 'Demande envoyée avec succès, en attente de validation',
            'conducteur': serializer.data
        }, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mon_profil_conducteur(request):
    try:
        conducteur = request.user.profil_conducteur
    except Conducteur.DoesNotExist:
        return Response({
            'erreur': 'Vous n\'êtes pas enregistré comme conducteur'
        }, status=status.HTTP_404_NOT_FOUND)

    serializer = ConducteurSerializer(conducteur)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def liste_conducteurs(request):
    statut = request.query_params.get('statut', None)

    if statut:
        conducteurs = Conducteur.objects.filter(statut_validation=statut)
    else:
        conducteurs = Conducteur.objects.all()

    serializer = ConducteurSerializer(conducteurs, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)




@api_view(['PUT'])
@permission_classes([IsAdminUser])
def valider_conducteur(request, conducteur_id):
    try:
        conducteur = Conducteur.objects.get(id=conducteur_id)
    except Conducteur.DoesNotExist:
        return Response(
            {'erreur': 'Conducteur introuvable'},
            status=status.HTTP_404_NOT_FOUND
        )

    nouveau_statut = request.data.get('statut')
    if nouveau_statut not in ['valide', 'rejete']:
        return Response(
            {'erreur': 'Statut invalide'},
            status=status.HTTP_400_BAD_REQUEST
        )

    conducteur.statut_validation = nouveau_statut
    if nouveau_statut == 'valide':
        conducteur.date_validation = timezone.now()
        # ── Enregistrer dans l'historique ──
        HistoriqueAction.objects.create(
            action='validation_conducteur',
            conducteur=conducteur,
            admin=request.user,
            description=f"Dossier conducteur validé par {request.user.prenom} {request.user.nom}",
        )
    if nouveau_statut == 'rejete':
        conducteur.motif_rejet = request.data.get('motif_rejet', '')
        # ── Enregistrer dans l'historique ──
        HistoriqueAction.objects.create(
            action='rejet_conducteur',
            conducteur=conducteur,
            admin=request.user,
            description=f"Dossier rejeté — Motif : {conducteur.motif_rejet}",
        )

    conducteur.save()
    return Response({
        'message': f'Conducteur {nouveau_statut} avec succès',
        'conducteur': ConducteurSerializer(conducteur).data
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def detail_conducteur_admin(request, conducteur_id):
    try:
        conducteur = Conducteur.objects.get(id=conducteur_id)
    except Conducteur.DoesNotExist:
        return Response({'erreur': 'Conducteur introuvable'}, status=status.HTTP_404_NOT_FOUND)

    return Response(ConducteurSerializer(conducteur).data)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def historique_conducteur(request, conducteur_id):
    try:
        conducteur = Conducteur.objects.get(id=conducteur_id)
    except Conducteur.DoesNotExist:
        return Response(
            {'erreur': 'Conducteur introuvable'},
            status=status.HTTP_404_NOT_FOUND
        )

    historique = HistoriqueAction.objects.filter(
        conducteur=conducteur
    ).select_related('admin')

    data = []
    for h in historique:
        data.append({
            'id': h.id,
            'action': h.action,
            'description': h.description,
            'montant': h.montant,
            'admin': f"{h.admin.prenom} {h.admin.nom}" if h.admin else "Système",
            'date_action': h.date_action.strftime('%d/%m/%Y à %H:%M'),
        })

    return Response(data)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def dashboard_stats(request):
    from django.utils import timezone
    from django.db.models import Sum, Count
    from django.db.models.functions import TruncMonth
    from vehicules.models import Vehicule
    from trajets.models import Trajet
    from reservations.models import Paiement, Reservation

    aujourd_hui = timezone.now().date()
    dans_30_jours = aujourd_hui + timezone.timedelta(days=30)

    # ── Stats de base ──────────────────────────────────────────────
    conducteurs_en_attente = Conducteur.objects.filter(statut_validation='en_attente')
    conducteurs_valides    = Conducteur.objects.filter(statut_validation='valide').count()
    conducteurs_rejetes    = Conducteur.objects.filter(statut_validation='rejete').count()
    vehicules_en_attente   = Vehicule.objects.filter(statut_validation='en_attente')
    vehicules_valides      = Vehicule.objects.filter(statut_validation='valide').count()
    trajets_actifs         = Trajet.objects.filter(
        date_depart=aujourd_hui, statut__in=['a_venir', 'en_cours']
    ).count()
    commissions = Paiement.objects.filter(statut_escrow='verse').aggregate(
        total=Sum('commission_montant')
    )
    total_commissions = float(commissions['total'] or 0)

    # ── Graphique 1 : Répartition statuts conducteurs ──────────────
    repartition_conducteurs = [
        {'statut': 'En attente', 'valeur': conducteurs_en_attente.count()},
        {'statut': 'Validés',    'valeur': conducteurs_valides},
        {'statut': 'Rejetés',    'valeur': conducteurs_rejetes},
    ]

    # ── Graphique 2 : Évolution inscriptions (12 derniers mois) ────
    il_y_a_12_mois = aujourd_hui - timezone.timedelta(days=365)
    inscriptions = (
        Conducteur.objects
        .filter(date_creation__date__gte=il_y_a_12_mois)
        .annotate(mois=TruncMonth('date_creation'))
        .values('mois')
        .annotate(total=Count('id'))
        .order_by('mois')
    )
    evolution_inscriptions = [
        {
            'mois': item['mois'].strftime('%b %Y'),
            'conducteurs': item['total']
        }
        for item in inscriptions
    ]

    # ── Graphique 3 : Réservations par mois (12 derniers mois) ─────
    from reservations.models import Reservation
    reservations_par_mois = (
        Reservation.objects
        .filter(date_reservation__date__gte=il_y_a_12_mois)
        .annotate(mois=TruncMonth('date_reservation'))
        .values('mois')
        .annotate(total=Count('id'))
        .order_by('mois')
    )
    evolution_reservations = [
        {
            'mois': item['mois'].strftime('%b %Y'),
            'reservations': item['total']
        }
        for item in reservations_par_mois
    ]

    # ── Graphique 4 : Revenus et commissions par mois ───────────────
    revenus_par_mois = (
        Paiement.objects
        .filter(
            statut_escrow='verse',
            date_versement__date__gte=il_y_a_12_mois
        )
        .annotate(mois=TruncMonth('date_versement'))
        .values('mois')
        .annotate(
            brut=Sum('montant_passager'),
            commission=Sum('commission_montant'),
            net=Sum('montant_conducteur'),
        )
        .order_by('mois')
    )
    evolution_revenus = [
        {
            'mois': item['mois'].strftime('%b %Y'),
            'brut': float(item['brut'] or 0),
            'commission': float(item['commission'] or 0),
            'net': float(item['net'] or 0),
        }
        for item in revenus_par_mois
    ]

    # ── Alertes ────────────────────────────────────────────────────
    assurances_expirees = Vehicule.objects.filter(
        statut_validation='valide',
        date_expiration_assurance__lt=aujourd_hui
    )
    assurances_bientot = Vehicule.objects.filter(
        statut_validation='valide',
        date_expiration_assurance__gte=aujourd_hui,
        date_expiration_assurance__lte=dans_30_jours
    )
    visites_expirees = Vehicule.objects.filter(
        statut_validation='valide',
        date_expiration_visite__lt=aujourd_hui
    )
    visites_bientot = Vehicule.objects.filter(
        statut_validation='valide',
        date_expiration_visite__gte=aujourd_hui,
        date_expiration_visite__lte=dans_30_jours
    )

    alertes = []
    for v in assurances_expirees:
        jours = (aujourd_hui - v.date_expiration_assurance).days
        alertes.append({
            'type': 'assurance_expiree',
            'icone': '⚠️',
            'texte': f"Assurance expirée depuis {jours}j — {v.marque} {v.modele} ({v.immatriculation})",
            'conducteur_id': v.conducteur.id,
            'conducteur_nom': f"{v.conducteur.utilisateur.prenom} {v.conducteur.utilisateur.nom}",
            'classe': 'bg-red-50 text-red-800 border-red-200',
        })
    for v in assurances_bientot:
        jours = (v.date_expiration_assurance - aujourd_hui).days
        alertes.append({
            'type': 'assurance_bientot',
            'icone': '⚠️',
            'texte': f"Assurance expire dans {jours}j — {v.marque} {v.modele} ({v.immatriculation})",
            'conducteur_id': v.conducteur.id,
            'conducteur_nom': f"{v.conducteur.utilisateur.prenom} {v.conducteur.utilisateur.nom}",
            'classe': 'bg-orange-50 text-orange-800 border-orange-200',
        })
    for v in visites_expirees:
        jours = (aujourd_hui - v.date_expiration_visite).days
        alertes.append({
            'type': 'visite_expiree',
            'icone': '🔧',
            'texte': f"Visite technique expirée depuis {jours}j — {v.marque} {v.modele} ({v.immatriculation})",
            'conducteur_id': v.conducteur.id,
            'conducteur_nom': f"{v.conducteur.utilisateur.prenom} {v.conducteur.utilisateur.nom}",
            'classe': 'bg-red-50 text-red-800 border-red-200',
        })
    for v in visites_bientot:
        jours = (v.date_expiration_visite - aujourd_hui).days
        alertes.append({
            'type': 'visite_bientot',
            'icone': '🔧',
            'texte': f"Visite technique expire dans {jours}j — {v.marque} {v.modele} ({v.immatriculation})",
            'conducteur_id': v.conducteur.id,
            'conducteur_nom': f"{v.conducteur.utilisateur.prenom} {v.conducteur.utilisateur.nom}",
            'classe': 'bg-orange-50 text-orange-800 border-orange-200',
        })

    # ── Dossiers prioritaires ──────────────────────────────────────
    prioritaires = []
    for c in conducteurs_en_attente.order_by('date_creation'):
        jours = (aujourd_hui - c.date_creation.date()).days
        prioritaires.append({
            'type': 'conducteur',
            'icone': '👤',
            'texte': f"{c.utilisateur.prenom} {c.utilisateur.nom} — en attente depuis {jours}j",
            'id': c.id,
            'classe': 'bg-yellow-50 text-yellow-800 border-yellow-200',
        })
    for v in vehicules_en_attente.order_by('date_creation'):
        jours = (aujourd_hui - v.date_creation.date()).days
        prioritaires.append({
            'type': 'vehicule',
            'icone': '🚗',
            'texte': f"{v.marque} {v.modele} ({v.immatriculation}) — en attente depuis {jours}j",
            'id': v.conducteur.id,
            'classe': 'bg-yellow-50 text-yellow-800 border-yellow-200',
        })

    return Response({
        'stats': {
            'conducteurs_en_attente': conducteurs_en_attente.count(),
            'conducteurs_valides': conducteurs_valides,
            'conducteurs_rejetes': conducteurs_rejetes,
            'vehicules_en_attente': vehicules_en_attente.count(),
            'vehicules_valides': vehicules_valides,
            'trajets_actifs': trajets_actifs,
            'total_commissions': total_commissions,
        },
        'graphiques': {
            'repartition_conducteurs': repartition_conducteurs,
            'evolution_inscriptions': evolution_inscriptions,
            'evolution_reservations': evolution_reservations,
            'evolution_revenus': evolution_revenus,
        },
        'alertes': alertes,
        'prioritaires': prioritaires[:10],
    })