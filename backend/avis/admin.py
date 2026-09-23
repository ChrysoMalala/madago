from django.contrib import admin
from .models import Avis


@admin.register(Avis)
class AvisAdmin(admin.ModelAdmin):
    list_display = ['id', 'passager', 'conducteur', 'note', 'date_avis']
    list_filter = ['note']
    search_fields = ['passager__nom', 'conducteur__utilisateur__nom']