from rest_framework import serializers
from .models import Reservation, Paiement
from utilisateurs.serializers import UtilisateurSerializer
from trajets.serializers import TrajetSerializer, SiegeSerializer


class PaiementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paiement
        fields = '__all__'
        read_only_fields = [
            'id', 'commission_montant', 'montant_conducteur',
            'statut_escrow', 'date_paiement', 'date_versement'
        ]


class ReservationSerializer(serializers.ModelSerializer):
    paiement = PaiementSerializer(read_only=True)
    passager_info = UtilisateurSerializer(source='passager', read_only=True)

    # `trajet` et `siege` (ci-dessous, hérités de fields = '__all__')
    # restent de simples ID — nécessaires pour la création d'une
    # réservation (POST). Ces deux champs supplémentaires exposent
    # en LECTURE SEULE les objets complets correspondants, pour que
    # le frontend puisse afficher directement ville_depart, date,
    # heure, numéro de siège, etc. sans requête supplémentaire.
    trajet_details = TrajetSerializer(source='trajet', read_only=True)
    siege_details = SiegeSerializer(source='siege', read_only=True)

    # Nom de la personne qui voyage réellement (titulaire du billet).
    # Calculé automatiquement à partir de type_reservation : soit les
    # infos du bénéficiaire, soit celles du compte réservateur.
    # Pratique pour l'affichage du billet côté frontend, sans avoir
    # à réimplémenter cette logique côté React.
    nom_titulaire = serializers.SerializerMethodField()

    class Meta:
        model = Reservation
        fields = '__all__'
        read_only_fields = [
            'id', 'passager', 'prix_total', 'statut',
            'present_a_bord', 'en_retard', 'date_reservation',
            'date_annulation', 'code_billet',
        ]

    def get_nom_titulaire(self, obj):
        return obj.nom_titulaire()

    def validate(self, data):
        """
        Si la réservation est faite pour une autre personne, le nom,
        le prénom et le téléphone du bénéficiaire deviennent
        obligatoires — sinon le billet ne pourrait pas indiquer
        clairement qui voyage réellement.
        """
        type_reservation = data.get('type_reservation', 'soi_meme')

        if type_reservation == 'autre_personne':
            nom = data.get('beneficiaire_nom')
            prenom = data.get('beneficiaire_prenom')
            # Le téléphone du bénéficiaire est optionnel : le nom et
            # le prénom suffisent pour l'identifier au point de
            # ramassage. Le téléphone reste une info utile si elle
            # est fournie, mais n'est plus bloquant.

            champs_manquants = []
            if not nom:
                champs_manquants.append('le nom')
            if not prenom:
                champs_manquants.append('le prénom')

            if champs_manquants:
                raise serializers.ValidationError({
                    'beneficiaire': (
                        "Pour une réservation faite pour une autre personne, "
                        f"veuillez renseigner {', '.join(champs_manquants)} "
                        "du bénéficiaire."
                    )
                })

        return data