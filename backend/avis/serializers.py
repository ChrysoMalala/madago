from rest_framework import serializers
from .models import Avis


class AvisSerializer(serializers.ModelSerializer):
    passager_nom = serializers.SerializerMethodField()
    passager_prenom = serializers.SerializerMethodField()

    class Meta:
        model = Avis
        fields = [
            'id', 'reservation', 'passager', 'conducteur',
            'note', 'commentaire', 'date_avis',
            'passager_nom', 'passager_prenom',
        ]
        read_only_fields = [
            'id', 'passager', 'conducteur', 'date_avis',
            'passager_nom', 'passager_prenom',
        ]

    def get_passager_nom(self, obj):
        return obj.passager.nom

    def get_passager_prenom(self, obj):
        return obj.passager.prenom