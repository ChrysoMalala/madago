from django.contrib import admin
from .models import Trajet, PointArret, Siege


@admin.register(Trajet)
class TrajetAdmin(admin.ModelAdmin):
    list_display = ('id', 'ville_depart', 'ville_arrivee', 'date_depart',
                    'heure_depart', 'statut', 'conducteur', 'date_publication')
    list_filter = ('statut', 'type_tarification', 'date_depart')
    search_fields = ('ville_depart', 'ville_arrivee', 'conducteur__utilisateur__email')


@admin.register(PointArret)
class PointArretAdmin(admin.ModelAdmin):
    list_display = ('id', 'trajet', 'type_point', 'nom_lieu', 'ordre')
    list_filter = ('type_point',)
    search_fields = ('nom_lieu',)


@admin.register(Siege)
class SiegeAdmin(admin.ModelAdmin):
    list_display = ('id', 'trajet', 'numero_siege', 'statut', 'prix')
    list_filter = ('statut',)