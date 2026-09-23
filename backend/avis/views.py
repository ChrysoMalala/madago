from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import Avis
from .serializers import AvisSerializer
from reservations.models import Reservation
from conducteurs.models import Conducteur


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def laisser_avis(request):
    reservation_id = request.data.get('reservation')

    try:
        reservation = Reservation.objects.get(
            pk=reservation_id,
            passager=request.user
        )
    except Reservation.DoesNotExist:
        return Response(
            {'erreur': 'Réservation introuvable'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Vérification 1 : trajet terminé
    if reservation.trajet.statut != 'termine':
        return Response(
            {'erreur': 'Le trajet n\'est pas encore terminé'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Vérification 2 : le passager doit avoir effectivement participé
    # au trajet.
    #
    # Un passager marqué "En retard" / "Non installé" possède
    # present_a_bord = False et ne peut donc pas laisser d'avis.
    if not reservation.present_a_bord:
        return Response(
            {
                'erreur': (
                    'Vous ne pouvez pas laisser un avis car '
                    'vous n\'avez pas été présent à bord de ce trajet.'
                )
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # Vérification 3 : avis pas encore laissé
    if hasattr(reservation, 'avis'):
        return Response(
            {'erreur': 'Vous avez déjà laissé un avis pour ce trajet'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Vérification 4 : note valide
    note = request.data.get('note')

    if not note or int(note) < 1 or int(note) > 5:
        return Response(
            {'erreur': 'La note doit être comprise entre 1 et 5'},
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer = AvisSerializer(data=request.data)

    if serializer.is_valid():
        avis = serializer.save(
            passager=request.user,
            conducteur=reservation.trajet.conducteur
        )

        # Recalcul de la note moyenne du conducteur
        conducteur = reservation.trajet.conducteur

        tous_avis = Avis.objects.filter(
            conducteur=conducteur
        )

        conducteur.note_moyenne = round(
            sum(a.note for a in tous_avis) / tous_avis.count(),
            2
        )

        conducteur.save()

        return Response({
            'message': 'Avis enregistré avec succès',
            'avis': AvisSerializer(avis).data
        }, status=status.HTTP_201_CREATED)

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(['GET'])
@permission_classes([AllowAny])
def avis_conducteur(request, conducteur_id):
    """
    Retourne tous les avis d'un conducteur.
    Accessible publiquement (visiteurs, passagers, conducteurs).
    """
    try:
        conducteur = Conducteur.objects.get(pk=conducteur_id)
    except Conducteur.DoesNotExist:
        return Response(
            {'erreur': 'Conducteur introuvable'},
            status=status.HTTP_404_NOT_FOUND
        )

    avis = Avis.objects.filter(
        conducteur=conducteur
    ).order_by('-date_avis')

    # Statistiques
    total = avis.count()
    note_moyenne = conducteur.note_moyenne or 0

    # Répartition par étoiles
    repartition = {}

    for i in range(1, 6):
        nb = avis.filter(note=i).count()

        repartition[str(i)] = {
            'nombre': nb,
            'pourcentage': round(
                (nb / total * 100),
                1
            ) if total > 0 else 0
        }

    return Response({
        'conducteur_id': conducteur_id,
        'note_moyenne': note_moyenne,
        'total_avis': total,
        'repartition': repartition,
        'avis': AvisSerializer(avis, many=True).data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mon_avis_pour_reservation(request, reservation_id):
    """
    Vérifie si le passager connecté a déjà laissé un avis
    pour une réservation donnée.
    Utile pour afficher ou masquer le bouton dans le frontend.
    """
    try:
        reservation = Reservation.objects.get(
            pk=reservation_id,
            passager=request.user
        )
    except Reservation.DoesNotExist:
        return Response(
            {'erreur': 'Réservation introuvable'},
            status=status.HTTP_404_NOT_FOUND
        )

    if hasattr(reservation, 'avis'):
        return Response({
            'a_deja_un_avis': True,
            'avis': AvisSerializer(reservation.avis).data
        })

    return Response({
        'a_deja_un_avis': False,
        'avis': None
    })