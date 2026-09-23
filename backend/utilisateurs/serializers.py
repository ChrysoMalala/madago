from rest_framework import serializers
from .models import Utilisateur


class InscriptionSerializer(serializers.ModelSerializer):
    mot_de_passe = serializers.CharField(
        write_only=True,
        min_length=8,
        style={'input_type': 'password'}
    )

    class Meta:
        model = Utilisateur
        # 'role' retiré : tous les nouveaux comptes sont passager par défaut
        fields = ['id', 'email', 'nom', 'prenom', 'telephone', 'mot_de_passe']

    def create(self, validated_data):
        mot_de_passe = validated_data.pop('mot_de_passe')
        utilisateur = Utilisateur(**validated_data, role='passager')
        utilisateur.set_password(mot_de_passe)
        utilisateur.save()
        return utilisateur


class UtilisateurSerializer(serializers.ModelSerializer):
    # La capacité conducteur dépend du profil Conducteur validé,
    # jamais du champ role (conservé mais non utilisé pour les décisions d'accès).
    est_conducteur = serializers.SerializerMethodField()

    class Meta:
        model = Utilisateur
        fields = ['id', 'email', 'nom', 'prenom', 'telephone', 'role',
                  'photo_profil', 'date_inscription', 'is_staff', 'est_conducteur',
                  'langue', 'theme']
        read_only_fields = ['id', 'date_inscription', 'is_staff', 'est_conducteur']
        # 'langue' et 'theme' NE SONT PAS dans read_only_fields :
        # l'utilisateur doit pouvoir les modifier via PUT /mon-profil/,
        # exactement comme n'importe quel autre champ de profil.

    def get_est_conducteur(self, obj):
        try:
            return obj.profil_conducteur.statut_validation == 'valide'
        except Exception:
            return False