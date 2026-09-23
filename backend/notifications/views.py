from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mes_notifications(request):
    notifications = Notification.objects.filter(utilisateur=request.user)
    return Response(NotificationSerializer(notifications, many=True).data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def marquer_lu(request, pk):
    try:
        notif = Notification.objects.get(pk=pk, utilisateur=request.user)
        notif.lu = True
        notif.save()
        return Response({'message': 'Notification marquée comme lue'})
    except Notification.DoesNotExist:
        return Response(
            {'erreur': 'Notification introuvable'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def marquer_toutes_lues(request):
    Notification.objects.filter(
        utilisateur=request.user,
        lu=False
    ).update(lu=True)
    return Response({'message': 'Toutes les notifications marquées comme lues'})