from django.urls import path
from . import views


urlpatterns = [

    # ========================================================
    # Véhicules du conducteur
    # ========================================================

    path(
        'vehicules/',
        views.mes_vehicules,
        name='mes-vehicules'
    ),

    path(
        'vehicules/<int:pk>/',
        views.detail_vehicule,
        name='detail-vehicule'
    ),

    # ========================================================
    # Photos des véhicules
    # ========================================================

    path(
        'vehicules/<int:vehicule_pk>/photos/<int:photo_pk>/',
        views.supprimer_photo_vehicule,
        name='supprimer-photo-vehicule'
    ),

    # ========================================================
    # Administration
    # ========================================================

    path(
        'admin/vehicules/',
        views.liste_vehicules_admin,
        name='liste-vehicules-admin'
    ),

    path(
        'admin/vehicules/<int:pk>/valider/',
        views.valider_vehicule,
        name='valider-vehicule'
    ),
]