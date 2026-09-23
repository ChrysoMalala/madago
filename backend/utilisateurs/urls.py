from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('auth/register/', views.inscription, name='inscription'),
    path('auth/login/', views.connexion, name='connexion'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/changer-mdp/', views.changer_mot_de_passe, name='changer-mdp'),
    path('utilisateurs/moi/', views.mon_profil, name='mon-profil'),
]

