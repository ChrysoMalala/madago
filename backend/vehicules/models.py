from django.db import models
from conducteurs.models import Conducteur


class Vehicule(models.Model):

    TYPE_CHOICES = (
        ('taxi_brousse', 'Taxi-brousse'),
        ('voiture_privee', 'Voiture privée'),
        ('autocar', 'Autocar'),
    )

    CARBURANT_CHOICES = (
        ('diesel', 'Diesel'),
        ('essence', 'Essence'),
    )

    STATUT_CHOICES = (
        ('en_attente', 'En attente'),
        ('valide', 'Validé'),
        ('suspendu', 'Suspendu'),
        ('rejete', 'Rejeté'),
        ('expire', 'Expiré'),
    )

    conducteur = models.ForeignKey(
        Conducteur,
        on_delete=models.CASCADE,
        related_name='vehicules'
    )

    type_vehicule = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES
    )

    marque = models.CharField(
        max_length=50
    )

    modele = models.CharField(
        max_length=50
    )

    annee = models.IntegerField()

    couleur = models.CharField(
        max_length=30
    )

    immatriculation = models.CharField(
        max_length=20,
        unique=True
    )

    nombre_places = models.IntegerField()

    type_carburant = models.CharField(
        max_length=20,
        choices=CARBURANT_CHOICES
    )

    equipements = models.TextField(
        null=True,
        blank=True
    )

    numero_assurance = models.CharField(
        max_length=30
    )

    date_expiration_assurance = models.DateField()

    date_visite_technique = models.DateField()

    date_expiration_visite = models.DateField()

    numero_licence = models.CharField(
        max_length=30,
        null=True,
        blank=True
    )

    cooperative = models.CharField(
        max_length=100,
        null=True,
        blank=True
    )

    zone_exploitation = models.CharField(
        max_length=150,
        null=True,
        blank=True
    )

    carte_grise_recto = models.ImageField(
        upload_to='documents/vehicules/'
    )

    carte_grise_verso = models.ImageField(
        upload_to='documents/vehicules/'
    )

    attestation_assurance = models.FileField(
        upload_to='documents/vehicules/'
    )

    certificat_visite = models.FileField(
        upload_to='documents/vehicules/'
    )

    licence_transport = models.FileField(
        upload_to='documents/vehicules/',
        null=True,
        blank=True
    )

    statut_validation = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default='en_attente'
    )

    motif_rejet = models.TextField(
        null=True,
        blank=True
    )

    date_creation = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.marque} {self.modele} ({self.immatriculation})"

    class Meta:
        verbose_name = "Véhicule"
        verbose_name_plural = "Véhicules"


class PhotoVehicule(models.Model):

    vehicule = models.ForeignKey(
        Vehicule,
        on_delete=models.CASCADE,
        related_name='photos'
    )

    photo = models.ImageField(
        upload_to='photos/vehicules/'
    )

    date_creation = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        verbose_name = "Photo du véhicule"
        verbose_name_plural = "Photos des véhicules"
        ordering = ['date_creation']

    def __str__(self):
        return f"Photo du véhicule {self.vehicule.immatriculation}"