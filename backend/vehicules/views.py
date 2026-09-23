from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response

from conducteurs.models import HistoriqueAction

from .models import Vehicule, PhotoVehicule
from .serializers import VehiculeSerializer


# ============================================================
# Champs administratifs sensibles
# ============================================================

CHAMPS_SENSIBLES_TEXTE = [
    'numero_assurance',
    'date_expiration_assurance',
    'date_visite_technique',
    'date_expiration_visite',
    'numero_licence',
    'cooperative',
    'zone_exploitation',
]


# ============================================================
# Documents sensibles
# ============================================================

CHAMPS_SENSIBLES_FICHIERS = [
    'carte_grise_recto',
    'carte_grise_verso',
    'attestation_assurance',
    'certificat_visite',
    'licence_transport',
]


# ============================================================
# Limite des photos
# ============================================================

MIN_PHOTOS_VEHICULE = 1
MAX_PHOTOS_VEHICULE = 4


# ============================================================
# Vérification des modifications sensibles
# ============================================================

def _champ_sensible_modifie(vehicule, request):
    """
    Retourne True si au moins une information administrative
    ou un document justificatif a réellement changé.
    """

    for champ in CHAMPS_SENSIBLES_TEXTE:

        if champ in request.data:

            nouvelle_valeur = str(
                request.data.get(champ)
            )

            valeur_actuelle = str(
                getattr(vehicule, champ)
            )

            if nouvelle_valeur != valeur_actuelle:
                return True

    for champ in CHAMPS_SENSIBLES_FICHIERS:

        if champ in request.FILES:
            return True

    return False


# ============================================================
# Récupération des photos envoyées
# ============================================================

def _get_photos_envoyees(request):
    """
    Récupère les fichiers envoyés avec la clé 'photos'.

    Exemple multipart/form-data :

        photos = photo1.jpg
        photos = photo2.jpg
        photos = photo3.jpg

    """

    return request.FILES.getlist('photos')


# ============================================================
# Création des photos d'un véhicule
# ============================================================

def _creer_photos_vehicule(vehicule, photos):
    """
    Crée les objets PhotoVehicule associés au véhicule.
    """

    for photo in photos:

        PhotoVehicule.objects.create(
            vehicule=vehicule,
            photo=photo
        )


# ============================================================
# Mes véhicules
# GET / POST
# ============================================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def mes_vehicules(request):

    try:

        conducteur = request.user.profil_conducteur

    except Exception:

        return Response(
            {
                'erreur': 'Profil conducteur requis'
            },
            status=status.HTTP_403_FORBIDDEN
        )

    # ========================================================
    # GET
    # ========================================================

    if request.method == 'GET':

        vehicules = Vehicule.objects.filter(
            conducteur=conducteur
        )

        serializer = VehiculeSerializer(
            vehicules,
            many=True
        )

        return Response(serializer.data)

    # ========================================================
    # POST
    # ========================================================

    if request.method == 'POST':

        # ----------------------------------------------------
        # Limite de véhicules
        # ----------------------------------------------------

        if Vehicule.objects.filter(
            conducteur=conducteur
        ).count() >= 5:

            return Response(
                {
                    'erreur': 'Limite de 5 véhicules atteinte'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------------------------
        # Récupération des photos
        # ----------------------------------------------------

        photos = _get_photos_envoyees(request)

        # ----------------------------------------------------
        # Vérification minimum
        # ----------------------------------------------------

        if len(photos) < MIN_PHOTOS_VEHICULE:

            return Response(
                {
                    'erreur': (
                        'Vous devez ajouter au moins '
                        f'{MIN_PHOTOS_VEHICULE} photo '
                        'du véhicule.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------------------------
        # Vérification maximum
        # ----------------------------------------------------

        if len(photos) > MAX_PHOTOS_VEHICULE:

            return Response(
                {
                    'erreur': (
                        'Vous pouvez ajouter au maximum '
                        f'{MAX_PHOTOS_VEHICULE} photos '
                        'pour un véhicule.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------------------------
        # Validation du véhicule
        # ----------------------------------------------------

        serializer = VehiculeSerializer(
            data=request.data
        )

        if not serializer.is_valid():

            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------------------------
        # Création du véhicule
        # ----------------------------------------------------

        vehicule = serializer.save(
            conducteur=conducteur
        )

        # ----------------------------------------------------
        # Création des photos
        # ----------------------------------------------------

        _creer_photos_vehicule(
            vehicule,
            photos
        )

        # ----------------------------------------------------
        # Serializer final
        # ----------------------------------------------------

        vehicule_serializer = VehiculeSerializer(
            vehicule
        )

        return Response(
            {
                'message': 'Véhicule soumis avec succès',
                'vehicule': vehicule_serializer.data
            },
            status=status.HTTP_201_CREATED
        )


# ============================================================
# Détail d'un véhicule
# GET / PUT / DELETE
# ============================================================

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def detail_vehicule(request, pk):

    try:

        conducteur = request.user.profil_conducteur

        vehicule = Vehicule.objects.get(
            pk=pk,
            conducteur=conducteur
        )

    except Vehicule.DoesNotExist:

        return Response(
            {
                'erreur': 'Véhicule introuvable'
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

    # ========================================================
    # GET
    # ========================================================

    if request.method == 'GET':

        serializer = VehiculeSerializer(
            vehicule
        )

        return Response(
            serializer.data
        )

    # ========================================================
    # PUT
    # ========================================================

    if request.method == 'PUT':

        # ----------------------------------------------------
        # Vérification trajet actif
        # ----------------------------------------------------

        from trajets.models import Trajet

        a_trajet_actif = Trajet.objects.filter(
            vehicule=vehicule,
            statut__in=[
                'a_venir',
                'en_cours'
            ]
        ).exists()

        if a_trajet_actif:

            return Response(
                {
                    'erreur': (
                        "Ce véhicule est associé à un trajet "
                        "en cours ou à venir. Il ne peut pas "
                        "être modifié tant que ce trajet n'est "
                        "pas terminé ou annulé."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------------------------
        # Détection des changements sensibles
        # ----------------------------------------------------

        champ_sensible_modifie = (
            _champ_sensible_modifie(
                vehicule,
                request
            )
        )

        # ----------------------------------------------------
        # Nouvelles photos
        # ----------------------------------------------------

        nouvelles_photos = _get_photos_envoyees(
            request
        )

        nombre_photos_existantes = (
            PhotoVehicule.objects.filter(
                vehicule=vehicule
            ).count()
        )

        nombre_total_photos = (
            nombre_photos_existantes
            + len(nouvelles_photos)
        )

        # ----------------------------------------------------
        # Vérification maximum
        # ----------------------------------------------------

        if nombre_total_photos > MAX_PHOTOS_VEHICULE:

            return Response(
                {
                    'erreur': (
                        f'Ce véhicule possède déjà '
                        f'{nombre_photos_existantes} photo(s). '
                        f'Vous pouvez avoir au maximum '
                        f'{MAX_PHOTOS_VEHICULE} photos.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------------------------
        # Validation du véhicule
        # ----------------------------------------------------

        serializer = VehiculeSerializer(
            vehicule,
            data=request.data,
            partial=True
        )

        if not serializer.is_valid():

            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------------------------
        # Véhicule validé + changement administratif
        # → retour en attente
        # ----------------------------------------------------

        if (
            vehicule.statut_validation
            in [
                'valide',
                'suspendu',
                'expire'
            ]
            and champ_sensible_modifie
        ):

            vehicule = serializer.save(
                statut_validation='en_attente',
                motif_rejet=None
            )

            # ------------------------------------------------
            # Ajout des nouvelles photos
            # ------------------------------------------------

            if nouvelles_photos:

                _creer_photos_vehicule(
                    vehicule,
                    nouvelles_photos
                )

            # ------------------------------------------------
            # Historique
            # ------------------------------------------------

            HistoriqueAction.objects.create(
                action='validation_vehicule',
                conducteur=vehicule.conducteur,
                admin=None,
                description=(
                    "Informations administratives ou documents "
                    "mis à jour par le conducteur — véhicule "
                    f"{vehicule.immatriculation} repassé en "
                    "attente de validation"
                ),
            )

            return Response(
                {
                    'message': (
                        'Informations administratives mises '
                        'à jour — véhicule repassé en attente '
                        'de validation'
                    ),
                    'vehicule': VehiculeSerializer(
                        vehicule
                    ).data
                }
            )

        # ----------------------------------------------------
        # Mise à jour normale
        # ----------------------------------------------------

        vehicule = serializer.save()

        # ----------------------------------------------------
        # Ajout des nouvelles photos
        # ----------------------------------------------------

        if nouvelles_photos:

            _creer_photos_vehicule(
                vehicule,
                nouvelles_photos
            )

        return Response(
            {
                'message': 'Véhicule mis à jour',
                'vehicule': VehiculeSerializer(
                    vehicule
                ).data
            }
        )

    # ========================================================
    # DELETE
    # ========================================================

    if request.method == 'DELETE':

        from trajets.models import Trajet

        a_trajet_actif = Trajet.objects.filter(
            vehicule=vehicule,
            statut__in=[
                'a_venir',
                'en_cours'
            ]
        ).exists()

        if a_trajet_actif:

            return Response(
                {
                    'erreur': (
                        "Ce véhicule est associé à un trajet "
                        "en cours ou à venir. Il ne peut pas "
                        "être supprimé tant que ce trajet n'est "
                        "pas terminé ou annulé."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        vehicule.delete()

        return Response(
            {
                'message': 'Véhicule supprimé avec succès'
            },
            status=status.HTTP_204_NO_CONTENT
        )


# ============================================================
# Liste des véhicules pour l'administration
# ============================================================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def liste_vehicules_admin(request):

    statut = request.query_params.get(
        'statut',
        None
    )

    conducteur_id = request.query_params.get(
        'conducteur',
        None
    )

    vehicules = Vehicule.objects.all()

    if statut:

        vehicules = vehicules.filter(
            statut_validation=statut
        )

    if conducteur_id:

        vehicules = vehicules.filter(
            conducteur_id=conducteur_id
        )

    serializer = VehiculeSerializer(
        vehicules,
        many=True
    )

    return Response(
        serializer.data
    )


# ============================================================
# Validation d'un véhicule par l'administrateur
# ============================================================

@api_view(['PUT'])
@permission_classes([IsAdminUser])
def valider_vehicule(request, pk):

    try:

        vehicule = Vehicule.objects.get(
            pk=pk
        )

    except Vehicule.DoesNotExist:

        return Response(
            {
                'erreur': 'Véhicule introuvable'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    nouveau_statut = request.data.get(
        'statut'
    )

    if nouveau_statut not in [
        'valide',
        'rejete',
        'suspendu'
    ]:

        return Response(
            {
                'erreur': 'Statut invalide'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    vehicule.statut_validation = (
        nouveau_statut
    )

    motif = request.data.get(
        'motif_rejet',
        ''
    )

    if nouveau_statut == 'rejete':

        vehicule.motif_rejet = motif

    else:

        vehicule.motif_rejet = None

    vehicule.save()

    # --------------------------------------------------------
    # Historique
    # --------------------------------------------------------

    actions_map = {

        'valide': (
            'validation_vehicule',
            f"Véhicule {vehicule.immatriculation} validé"
        ),

        'rejete': (
            'rejet_vehicule',
            (
                f"Véhicule {vehicule.immatriculation} rejeté "
                f"— Motif : {motif}"
            )
        ),

        'suspendu': (
            'suspension_vehicule',
            (
                f"Véhicule {vehicule.immatriculation} "
                "suspendu"
            )
        ),
    }

    action_cle, description = (
        actions_map[nouveau_statut]
    )

    HistoriqueAction.objects.create(
        action=action_cle,
        conducteur=vehicule.conducteur,
        admin=request.user,
        description=description,
    )

    return Response(
        {
            'message': (
                f'Véhicule {nouveau_statut} avec succès'
            ),
            'vehicule': VehiculeSerializer(
                vehicule
            ).data
        }
    )


# ============================================================
# Suppression d'une photo précise
# ============================================================

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def supprimer_photo_vehicule(request, vehicule_pk, photo_pk):

    try:

        conducteur = request.user.profil_conducteur

        vehicule = Vehicule.objects.get(
            pk=vehicule_pk,
            conducteur=conducteur
        )

    except Vehicule.DoesNotExist:

        return Response(
            {
                'erreur': 'Véhicule introuvable'
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

    try:

        photo = PhotoVehicule.objects.get(
            pk=photo_pk,
            vehicule=vehicule
        )

    except PhotoVehicule.DoesNotExist:

        return Response(
            {
                'erreur': 'Photo introuvable'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    # --------------------------------------------------------
    # Minimum 1 photo
    # --------------------------------------------------------

    nombre_photos = PhotoVehicule.objects.filter(
        vehicule=vehicule
    ).count()

    if nombre_photos <= MIN_PHOTOS_VEHICULE:

        return Response(
            {
                'erreur': (
                    'Un véhicule doit conserver au moins '
                    f'{MIN_PHOTOS_VEHICULE} photo.'
                )
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # --------------------------------------------------------
    # Suppression
    # --------------------------------------------------------

    photo.delete()

    return Response(
        {
            'message': 'Photo supprimée avec succès'
        },
        status=status.HTTP_200_OK
    )