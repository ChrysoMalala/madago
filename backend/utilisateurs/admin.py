from django.contrib import admin
from .models import Utilisateur


@admin.register(Utilisateur)
class UtilisateurAdmin(admin.ModelAdmin):
    list_display = ('id', 'email', 'nom', 'prenom', 'role', 'est_actif', 'date_inscription')
    list_filter = ('role', 'est_actif')
    search_fields = ('email', 'nom', 'prenom')