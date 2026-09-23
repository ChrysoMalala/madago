from django.urls import path
from . import views

urlpatterns = [
    path('reservations/', views.creer_reservation, name='creer-reservation'),
    path('reservations/mes-reservations/', views.mes_reservations, name='mes-reservations'),
    path('reservations/<int:pk>/annuler/', views.annuler_reservation, name='annuler-reservation'),
    path('admin/trajets/<int:trajet_id>/reservations/', views.reservations_trajet_admin, name='reservations-trajet-admin'),
    path('trajets/<int:trajet_pk>/reservations/<int:reservation_pk>/marquer/', 
     views.marquer_passager, 
     name='marquer-passager'),
     path('trajets/<int:trajet_pk>/passagers/', 
     views.passagers_trajet_conducteur, 
     name='passagers-trajet-conducteur'),
     path('reservations/<int:pk>/billet/', views.telecharger_billet, name='telecharger-billet'),
     path('reservations/groupe/<str:code_groupe>/billet/', views.telecharger_billet_groupe, name='telecharger-billet-groupe'),
]