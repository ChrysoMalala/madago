from rest_framework import serializers
from .models import Trajet, PointArret, Siege
from conducteurs.models import Conducteur
from vehicules.models import Vehicule
from avis.models import Avis


class AvisPublicSerializer(serializers.ModelSerializer):
    """
    Représentation publique d'un avis laissé par un passager sur un
    conducteur — seul le prénom du passager est affiché (pas son nom
    complet ni son email), pour respecter un minimum de discrétion.
    """
    passager_prenom = serializers.SerializerMethodField()

    class Meta:
        model = Avis
        fields = ['id', 'note', 'commentaire', 'date_avis', 'passager_prenom']

    def get_passager_prenom(self, obj):
        return obj.passager.prenom


class ConducteurPublicSerializer(serializers.ModelSerializer):
    """
    Représentation PUBLIQUE d'un conducteur, exposée aux passagers
    sur la page de détail d'un trajet.

    Ne contient AUCUNE donnée sensible (numéro CIN, photos CIN/permis,
    infos Mobile Money, motif de rejet...) — uniquement ce qui aide un
    passager à évaluer la fiabilité du conducteur avant de réserver.
    """
    prenom = serializers.CharField(source='utilisateur.prenom', read_only=True)
    nom = serializers.CharField(source='utilisateur.nom', read_only=True)
    photo_profil = serializers.ImageField(source='utilisateur.photo_profil', read_only=True)
    verifie = serializers.SerializerMethodField()
    nombre_trajets_effectues = serializers.SerializerMethodField()
    membre_depuis = serializers.DateTimeField(source='date_creation', read_only=True)
    avis_recents = serializers.SerializerMethodField()

    class Meta:
        model = Conducteur
        fields = [
            'id', 'prenom', 'nom', 'photo_profil', 'note_moyenne',
            'verifie', 'nombre_trajets_effectues', 'membre_depuis',
            'avis_recents',
        ]

    def get_verifie(self, obj):
        return obj.statut_validation == 'valide'

    def get_nombre_trajets_effectues(self, obj):
        return obj.trajets.filter(statut='termine').count()

    def get_avis_recents(self, obj):
        avis = obj.avis_recus.order_by('-date_avis')[:5]
        return AvisPublicSerializer(avis, many=True).data


class VehiculePublicSerializer(serializers.ModelSerializer):

    verifie = serializers.SerializerMethodField()

    photos = serializers.SerializerMethodField()


    class Meta:

        model = Vehicule

        fields = [
            'id',
            'type_vehicule',
            'marque',
            'modele',
            'couleur',
            'nombre_places',
            'type_carburant',
            'equipements',
            'photos',
            'verifie',
        ]



    def get_photos(self, obj):

        request = self.context.get('request')


        images = []

        for photo in obj.photos.all():

            url = photo.photo.url


            if request:

                url = request.build_absolute_uri(url)


            images.append(url)


        return images



    def get_verifie(self, obj):

        return obj.statut_validation == 'valide'


class PointArretSerializer(serializers.ModelSerializer):
    class Meta:
        model = PointArret
        fields = ['id', 'type_point', 'nom_lieu', 'ordre']


class SiegeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Siege
        fields = ['id', 'numero_siege', 'statut', 'prix', 'pos_x', 'pos_y', 'est_chauffeur']


class TrajetSerializer(serializers.ModelSerializer):
    points_arret = PointArretSerializer(many=True, read_only=True)
    sieges = SiegeSerializer(many=True, read_only=True)

    # `conducteur` et `vehicule` (hérités de fields = '__all__')
    # restent de simples ID, nécessaires pour la création/mise à
    # jour d'un trajet. Ces deux champs supplémentaires exposent en
    # LECTURE SEULE les représentations publiques complètes, pour
    # que le frontend affiche de vraies infos plutôt que des ID bruts.
    conducteur_details = ConducteurPublicSerializer(source='conducteur', read_only=True)
    vehicule_details = VehiculePublicSerializer(source='vehicule', read_only=True)

    # ── Avis propres à CE trajet (pas tous les avis du conducteur) ──
    # Un Avis n'a pas de champ trajet direct (il est lié à une
    # Reservation, elle-même liée au trajet) — on remonte donc via
    # reservation__trajet. Toujours calculé (liste vide si le trajet
    # n'est pas encore terminé ou n'a pas reçu d'avis), le frontend
    # décide quand afficher cette section (trajet.statut == 'termine').
    avis_trajet = serializers.SerializerMethodField()
    note_moyenne_trajet = serializers.SerializerMethodField()

    class Meta:
        model = Trajet
        fields = '__all__'
        read_only_fields = ['id', 'conducteur', 'statut', 'date_publication']

    def get_avis_trajet(self, obj):
        avis = Avis.objects.filter(reservation__trajet=obj).order_by('-date_avis')
        return AvisPublicSerializer(avis, many=True).data

    def get_note_moyenne_trajet(self, obj):
        avis = Avis.objects.filter(reservation__trajet=obj)
        if not avis.exists():
            return None
        moyenne = sum(a.note for a in avis) / avis.count()
        return round(moyenne, 1)