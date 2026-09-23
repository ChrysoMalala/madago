from django.urls import path
from . import views

urlpatterns = [
    path('trajets/', views.liste_trajets, name='liste-trajets'),
    path('trajets/publier/', views.publier_trajet, name='publier-trajet'),
    path('trajets/mes-trajets/', views.mes_trajets, name='mes-trajets'),
    path('trajets/<int:pk>/', views.detail_trajet, name='detail-trajet'),
    path('trajets/<int:pk>/supprimer/', views.supprimer_trajet, name='supprimer-trajet'),
    path('trajets/<int:pk>/confirmer-depart/', views.confirmer_depart, name='confirmer-depart'),
    path('trajets/<int:pk>/points-arret/', views.ajouter_point_arret, name='ajouter-point-arret'),
    path('trajets/<int:pk>/verifier-reservation/', views.verifier_reservation, name='verifier-reservation'),
    path('admin/conducteurs/<int:conducteur_id>/trajets/', views.trajets_conducteur_admin, name='trajets-conducteur-admin'),
    path('trajets/<int:pk>/confirmer-fin/', views.confirmer_fin_trajet, name='confirmer-fin-trajet'),
    path('trajets/verifier-conflit/', views.verifier_conflit_trajet, name='verifier-conflit'),
    path('trajets/verifier-conflit/', views.verifier_conflit_trajet, name='verifier-conflit'),
]