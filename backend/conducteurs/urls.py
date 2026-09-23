from django.urls import path
from . import views

urlpatterns = [
    path('devenir-conducteur/', views.devenir_conducteur, name='devenir-conducteur'),
    path('conducteurs/moi/', views.mon_profil_conducteur, name='mon-profil-conducteur'),
    path('conducteurs/', views.liste_conducteurs, name='liste-conducteurs'),
    path('conducteurs/<int:conducteur_id>/valider/', views.valider_conducteur, name='valider-conducteur'),
    path('conducteurs/<int:conducteur_id>/detail-admin/', views.detail_conducteur_admin, name='detail-conducteur-admin'),
    path('conducteurs/<int:conducteur_id>/historique/', views.historique_conducteur, name='historique-conducteur'),
    path('admin/dashboard/stats/', views.dashboard_stats, name='dashboard-stats'),
]