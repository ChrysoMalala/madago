from rest_framework import serializers
from django.utils import timezone

from .models import Vehicule, PhotoVehicule


class PhotoVehiculeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PhotoVehicule
        fields = [
            'id',
            'photo',
            'date_creation',
        ]
        read_only_fields = [
            'id',
            'date_creation',
        ]


class VehiculeSerializer(serializers.ModelSerializer):
    conducteur_nom = serializers.SerializerMethodField()
    conducteur_prenom = serializers.SerializerMethodField()
    alertes_vehicule = serializers.SerializerMethodField()

    photos = PhotoVehiculeSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = Vehicule

        fields = [
            'id',
            'conducteur',
            'conducteur_nom',
            'conducteur_prenom',

            'type_vehicule',
            'marque',
            'modele',
            'annee',
            'couleur',
            'immatriculation',
            'nombre_places',
            'type_carburant',
            'equipements',

            'numero_assurance',
            'date_expiration_assurance',
            'date_visite_technique',
            'date_expiration_visite',

            'numero_licence',
            'cooperative',
            'zone_exploitation',

            'carte_grise_recto',
            'carte_grise_verso',
            'attestation_assurance',
            'certificat_visite',
            'licence_transport',

            'photos',

            'statut_validation',
            'motif_rejet',
            'date_creation',

            'alertes_vehicule',
        ]

        read_only_fields = [
            'id',
            'conducteur',
            'statut_validation',
            'motif_rejet',
            'date_creation',
            'conducteur_nom',
            'conducteur_prenom',
            'alertes_vehicule',
            'photos',
        ]

    def get_conducteur_nom(self, obj):
        return obj.conducteur.utilisateur.nom

    def get_conducteur_prenom(self, obj):
        return obj.conducteur.utilisateur.prenom

    def get_alertes_vehicule(self, obj):
        alertes = []

        aujourd_hui = timezone.now().date()

        jours_assurance = (
            obj.date_expiration_assurance - aujourd_hui
        ).days

        jours_visite = (
            obj.date_expiration_visite - aujourd_hui
        ).days

        # ============================
        # Alerte assurance
        # ============================

        if jours_assurance < 0:
            alertes.append({
                'type': 'assurance_expiree',
                'icone': '⚠️',
                'texte': (
                    f'Assurance expirée depuis '
                    f'{abs(jours_assurance)}j'
                ),
                'classe': 'bg-red-100 text-red-800',
            })

        elif jours_assurance <= 30:
            alertes.append({
                'type': 'assurance_bientot',
                'icone': '⚠️',
                'texte': (
                    f'Assurance expire dans '
                    f'{jours_assurance}j'
                ),
                'classe': 'bg-orange-100 text-orange-800',
            })

        # ============================
        # Alerte visite technique
        # ============================

        if jours_visite < 0:
            alertes.append({
                'type': 'visite_expiree',
                'icone': '🔧',
                'texte': (
                    f'Visite technique expirée depuis '
                    f'{abs(jours_visite)}j'
                ),
                'classe': 'bg-red-100 text-red-800',
            })

        elif jours_visite <= 30:
            alertes.append({
                'type': 'visite_bientot',
                'icone': '🔧',
                'texte': (
                    f'Visite technique expire dans '
                    f'{jours_visite}j'
                ),
                'classe': 'bg-orange-100 text-orange-800',
            })

        return alertes