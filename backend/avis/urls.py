from django.urls import path
from . import views

urlpatterns = [
    path('avis/', views.laisser_avis, name='laisser-avis'),
    path('avis/conducteur/<int:conducteur_id>/', views.avis_conducteur, name='avis-conducteur'),
    path('avis/reservation/<int:reservation_id>/mon-avis/', views.mon_avis_pour_reservation, name='mon-avis'),
]