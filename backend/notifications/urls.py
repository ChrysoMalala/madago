from django.urls import path
from . import views

urlpatterns = [
    path('notifications/', views.mes_notifications, name='mes-notifications'),
    path('notifications/<int:pk>/lire/', views.marquer_lu, name='marquer-lu'),
    path('notifications/tout-lire/', views.marquer_toutes_lues, name='tout-lire'),
]