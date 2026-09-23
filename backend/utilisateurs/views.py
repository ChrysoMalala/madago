from rest_framework import status
from rest_framework.decorators import (
    api_view,
    permission_classes,
    parser_classes,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import (
    MultiPartParser,
    FormParser,
    JSONParser,
)
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Utilisateur
from .serializers import InscriptionSerializer, UtilisateurSerializer


def get_tokens_for_user(utilisateur):
    refresh = RefreshToken.for_user(utilisateur)

    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


# ============================================================
# INSCRIPTION
# ============================================================

@api_view(['POST'])
@permission_classes([AllowAny])
def inscription(request):
    # Le rôle n'est plus accepté depuis le frontend :
    # InscriptionSerializer force toujours role='passager'
    # dans sa méthode create().

    serializer = InscriptionSerializer(data=request.data)

    if serializer.is_valid():
        utilisateur = serializer.save()

        tokens = get_tokens_for_user(utilisateur)

        return Response({
            'message': 'Compte créé avec succès',
            'utilisateur': UtilisateurSerializer(
                utilisateur,
                context={'request': request}
            ).data,
            'tokens': tokens
        }, status=status.HTTP_201_CREATED)

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )


# ============================================================
# CONNEXION
# ============================================================

@api_view(['POST'])
@permission_classes([AllowAny])
def connexion(request):
    email = request.data.get('email')
    mot_de_passe = request.data.get('mot_de_passe')

    if not email or not mot_de_passe:
        return Response({
            'erreur': 'Email et mot de passe obligatoires'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        utilisateur = Utilisateur.objects.get(email=email)

    except Utilisateur.DoesNotExist:
        return Response({
            'erreur': 'Email ou mot de passe incorrect'
        }, status=status.HTTP_401_UNAUTHORIZED)

    if not utilisateur.check_password(mot_de_passe):
        return Response({
            'erreur': 'Email ou mot de passe incorrect'
        }, status=status.HTTP_401_UNAUTHORIZED)

    if not utilisateur.est_actif:
        return Response({
            'erreur': 'Ce compte est désactivé'
        }, status=status.HTTP_403_FORBIDDEN)

    tokens = get_tokens_for_user(utilisateur)

    return Response({
        'message': 'Connexion réussie',

        'utilisateur': UtilisateurSerializer(
            utilisateur,
            context={'request': request}
        ).data,

        'tokens': tokens

    }, status=status.HTTP_200_OK)


# ============================================================
# MON PROFIL
# ============================================================
#
# GET
#     Récupération du profil
#
# PUT JSON
#     Modification nom, prénom, téléphone,
#     langue, thème...
#
# PUT multipart/form-data
#     Modification / ajout de la photo de profil
#
# ============================================================

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
@parser_classes([
    MultiPartParser,
    FormParser,
    JSONParser,
])
def mon_profil(request):
    utilisateur = request.user

    # --------------------------------------------------------
    # RÉCUPÉRATION
    # --------------------------------------------------------

    if request.method == 'GET':

        serializer = UtilisateurSerializer(
            utilisateur,
            context={'request': request}
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    # --------------------------------------------------------
    # MODIFICATION
    # --------------------------------------------------------

    if request.method == 'PUT':

        serializer = UtilisateurSerializer(
            utilisateur,
            data=request.data,
            partial=True,
            context={'request': request}
        )

        if serializer.is_valid():

            serializer.save()

            return Response({
                'message': 'Profil mis à jour avec succès',
                'utilisateur': serializer.data
            }, status=status.HTTP_200_OK)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


# ============================================================
# CHANGER LE MOT DE PASSE
# ============================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def changer_mot_de_passe(request):
    utilisateur = request.user

    ancien = request.data.get('ancien_mot_de_passe')
    nouveau = request.data.get('nouveau_mot_de_passe')

    if not ancien or not nouveau:
        return Response({
            'erreur':
                'Ancien et nouveau mot de passe obligatoires'
        }, status=status.HTTP_400_BAD_REQUEST)

    if not utilisateur.check_password(ancien):
        return Response({
            'erreur':
                'Ancien mot de passe incorrect'
        }, status=status.HTTP_400_BAD_REQUEST)

    if len(nouveau) < 8:
        return Response({
            'erreur':
                'Le nouveau mot de passe doit contenir au moins 8 caractères'
        }, status=status.HTTP_400_BAD_REQUEST)

    utilisateur.set_password(nouveau)

    utilisateur.save()

    return Response({
        'message': 'Mot de passe modifié avec succès'
    })