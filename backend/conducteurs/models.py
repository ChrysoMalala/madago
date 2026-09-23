from django.db import models
from utilisateurs.models import Utilisateur


class Conducteur(models.Model):
    STATUT_CHOICES = (
        ('en_attente', 'En attente'),
        ('valide', 'Validé'),
        ('rejete', 'Rejeté'),
    )
    OPERATEUR_CHOICES = (
        ('mvola', 'MVola'),
        ('orange_money', 'Orange Money'),
        ('airtel_money', 'Airtel Money'),
    )

    utilisateur = models.OneToOneField(
        Utilisateur,
        on_delete=models.CASCADE,
        related_name='profil_conducteur'
    )
    date_naissance = models.DateField()
    lieu_naissance = models.CharField(max_length=100)
    numero_cin = models.CharField(max_length=20, unique=True)
    cin_recto = models.ImageField(upload_to='documents/cin/')
    cin_verso = models.ImageField(upload_to='documents/cin/')
    numero_permis = models.CharField(max_length=20, unique=True)
    categorie_permis = models.CharField(max_length=5)
    permis_recto = models.ImageField(upload_to='documents/permis/')
    permis_verso = models.ImageField(upload_to='documents/permis/')
    contact_urgence_nom = models.CharField(max_length=100)
    contact_urgence_telephone = models.CharField(max_length=20)
    operateur_mobile_money = models.CharField(max_length=20, choices=OPERATEUR_CHOICES)
    numero_mobile_money = models.CharField(max_length=20)
    titulaire_mobile_money = models.CharField(max_length=100)
    statut_validation = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default='en_attente'
    )
    motif_rejet = models.TextField(null=True, blank=True)
    note_moyenne = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    date_validation = models.DateTimeField(null=True, blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Conducteur : {self.utilisateur.prenom} {self.utilisateur.nom}"



class HistoriqueAction(models.Model):
    ACTION_CHOICES = (
        ('validation_conducteur', 'Validation conducteur'),
        ('rejet_conducteur', 'Rejet conducteur'),
        ('validation_vehicule', 'Validation véhicule'),
        ('rejet_vehicule', 'Rejet véhicule'),
        ('suspension_vehicule', 'Suspension véhicule'),
        ('confirmation_depart', 'Confirmation départ'),
        ('confirmation_fin', 'Confirmation fin trajet'),
        ('transfert_revenus', 'Transfert revenus'),
    )

    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    conducteur = models.ForeignKey(
        Conducteur, on_delete=models.CASCADE,
        related_name='historique_actions'
    )
    admin = models.ForeignKey(
        'utilisateurs.Utilisateur',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='actions_admin'
    )
    description = models.TextField()
    montant = models.DecimalField(
        max_digits=10, decimal_places=2,
        null=True, blank=True
    )
    date_action = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_action']

    def __str__(self):
        return f"{self.action} — {self.conducteur} — {self.date_action}"