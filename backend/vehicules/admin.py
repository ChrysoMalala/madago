from django.contrib import admin
from .models import Vehicule


@admin.register(Vehicule)
class VehiculeAdmin(admin.ModelAdmin):
    list_display = [
        'conducteur', 'marque', 'modele',
        'immatriculation', 'type_vehicule', 'statut_validation'
    ]
    list_filter = ['statut_validation', 'type_vehicule', 'type_carburant']
    search_fields = [
        'immatriculation', 'marque', 'modele',
        'conducteur__utilisateur__nom'
    ]