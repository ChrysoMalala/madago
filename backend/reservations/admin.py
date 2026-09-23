from django.contrib import admin
from .models import Reservation, Paiement


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'passager', 'trajet', 'siege',
        'prix_total', 'statut', 'date_reservation'
    ]
    list_filter = ['statut', 'present_a_bord']
    search_fields = [
        'passager__nom', 'passager__prenom',
        'trajet__ville_depart', 'trajet__ville_arrivee'
    ]


@admin.register(Paiement)
class PaiementAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'reservation', 'montant_passager',
        'operateur', 'statut_escrow', 'date_paiement'
    ]
    list_filter = ['statut_escrow', 'operateur']