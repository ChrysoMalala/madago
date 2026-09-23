from django.db import models
from conducteurs.models import Conducteur
from vehicules.models import Vehicule


class Trajet(models.Model):
    TARIF_CHOICES = (
        ('unique', 'Tarif unique'),
        ('par_destination', 'Tarif par destination'),
    )
    STATUT_CHOICES = (
        ('a_venir', 'À venir'),   
        ('en_cours', 'En cours'),
        ('termine', 'Terminé'),
        ('annule', 'Annulé'),
    )
    conducteur = models.ForeignKey(
        Conducteur, on_delete=models.CASCADE,
        related_name='trajets'
    )
    vehicule = models.ForeignKey(
        Vehicule, on_delete=models.CASCADE,
        related_name='trajets'
    )
    ville_depart = models.CharField(max_length=100)
    ville_arrivee = models.CharField(max_length=100)
    date_depart = models.DateField()
    heure_depart = models.TimeField()
    duree_estimee = models.CharField(max_length=100,null=True,blank=True)
    type_tarification = models.CharField(max_length=20, choices=TARIF_CHOICES)
    prix_unique = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    distance_km = models.IntegerField()
    politique_bagages = models.TextField(null=True, blank=True)
    pauses_prevues = models.TextField(null=True, blank=True)
    infos_complementaires = models.TextField(null=True, blank=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='a_venir')
    heure_depart_reelle = models.DateTimeField(null=True, blank=True)
    heure_arrivee_reelle = models.DateTimeField(null=True, blank=True)
    conducteur_remplacant = models.CharField(max_length=100, null=True, blank=True)
    date_publication = models.DateTimeField(auto_now_add=True)
    # Coordonnées GPS des villes (remplies automatiquement à la publication)
    lat_depart  = models.FloatField(null=True, blank=True)
    lon_depart  = models.FloatField(null=True, blank=True)
    lat_arrivee = models.FloatField(null=True, blank=True)
    lon_arrivee = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"{self.ville_depart} → {self.ville_arrivee} ({self.date_depart})"


class PointArret(models.Model):
    TYPE_CHOICES = (
        ('ramassage', 'Ramassage'),
        ('depose', 'Dépose'),
    )
    trajet = models.ForeignKey(
        Trajet, on_delete=models.CASCADE,
        related_name='points_arret'
    )
    type_point = models.CharField(max_length=20, choices=TYPE_CHOICES)
    nom_lieu = models.CharField(max_length=150)
    ordre = models.IntegerField()

    class Meta:
        ordering = ['ordre']

    def __str__(self):
        return f"{self.type_point} : {self.nom_lieu}"


class Siege(models.Model):
    STATUT_CHOICES = (
        ('disponible', 'Disponible'),
        ('reserve', 'Réservé'),
        ('indisponible', 'Indisponible'),
    )
    trajet = models.ForeignKey(
        Trajet, on_delete=models.CASCADE,
        related_name='sieges'
    )
    numero_siege = models.IntegerField()
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='disponible')
    prix = models.DecimalField(max_digits=10, decimal_places=2)
    pos_x = models.IntegerField(default=0)
    pos_y = models.IntegerField(default=0)
    est_chauffeur = models.BooleanField(default=False)

    def __str__(self):
        return f"Siège {self.numero_siege} — {self.statut}"