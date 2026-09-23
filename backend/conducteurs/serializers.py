from rest_framework import serializers
from django.utils import timezone
from .models import Conducteur
from utilisateurs.serializers import UtilisateurSerializer


class ConducteurSerializer(serializers.ModelSerializer):
    utilisateur_info = UtilisateurSerializer(source='utilisateur', read_only=True)

    # ── Alertes calculées dynamiquement ───────────────────────────────
    alertes = serializers.SerializerMethodField()

    class Meta:
        model = Conducteur
        fields = '__all__'
        read_only_fields = [
            'id', 'statut_validation', 'note_moyenne',
            'date_validation', 'date_creation', 'utilisateur',
        ]

    def get_alertes(self, obj):
        alertes = []
        aujourd_hui = timezone.now().date()

        # 🚗 Nouveau véhicule en attente
        if obj.vehicules.filter(statut_validation='en_attente').exists():
            alertes.append({
                'type': 'vehicule_en_attente',
                'icone': '🚗',
                'texte': 'Nouveau véhicule à valider',
                'classe': 'bg-blue-100 text-blue-800',
            })

        # ⚠️ Assurance expirée ou bientôt (dans 30 jours)
        vehicules_valides = obj.vehicules.filter(statut_validation='valide')
        for v in vehicules_valides:
            jours_assurance = (v.date_expiration_assurance - aujourd_hui).days
            jours_visite = (v.date_expiration_visite - aujourd_hui).days

            if jours_assurance < 0:
                alertes.append({
                    'type': 'assurance_expiree',
                    'icone': '⚠️',
                    'texte': f'Assurance expirée ({v.immatriculation})',
                    'classe': 'bg-red-100 text-red-800',
                })
            elif jours_assurance <= 30:
                alertes.append({
                    'type': 'assurance_bientot',
                    'icone': '⚠️',
                    'texte': f'Assurance expire dans {jours_assurance}j ({v.immatriculation})',
                    'classe': 'bg-orange-100 text-orange-800',
                })

            if jours_visite < 0:
                alertes.append({
                    'type': 'visite_expiree',
                    'icone': '⚠️',
                    'texte': f'Visite technique expirée ({v.immatriculation})',
                    'classe': 'bg-red-100 text-red-800',
                })
            elif jours_visite <= 30:
                alertes.append({
                    'type': 'visite_bientot',
                    'icone': '⚠️',
                    'texte': f'Visite technique expire dans {jours_visite}j ({v.immatriculation})',
                    'classe': 'bg-orange-100 text-orange-800',
                })

        return alertes