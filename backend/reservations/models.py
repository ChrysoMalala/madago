import uuid

from django.db import models
from utilisateurs.models import Utilisateur
from trajets.models import Trajet, Siege, PointArret


def generer_code_billet():
    """
    Génère un code de billet unique et lisible, de la forme
    MDG-A3F9K2R8 (préfixe fixe + 8 caractères aléatoires en majuscules).

    On utilise uuid4 (déjà inclus dans Python, pas de dépendance
    supplémentaire) et on ne garde qu'une partie du résultat pour
    obtenir un code court mais suffisamment unique pour ce cas
    d'usage (identifiant affiché sur un billet, pas un secret
    cryptographique).
    """
    return f"MDG-{uuid.uuid4().hex[:8].upper()}"


class Reservation(models.Model):
    STATUT_CHOICES = (
        ('confirmee', 'Confirmée'),
        ('annulee', 'Annulée'),
        ('remboursee', 'Remboursée'),
    )

    TYPE_RESERVATION_CHOICES = (
        ('soi_meme', 'Pour moi-même'),
        ('autre_personne', 'Pour une autre personne'),
    )

    trajet = models.ForeignKey(
        Trajet, on_delete=models.CASCADE,
        related_name='reservations'
    )
    passager = models.ForeignKey(
        Utilisateur, on_delete=models.CASCADE,
        related_name='reservations'
    )
    siege = models.ForeignKey(
        Siege, on_delete=models.CASCADE,
        related_name='reservations'
    )
    point_ramassage = models.ForeignKey(
        PointArret, on_delete=models.CASCADE,
        related_name='reservations_ramassage'
    )
    point_depose = models.ForeignKey(
        PointArret, on_delete=models.CASCADE,
        related_name='reservations_depose'
    )
    prix_total = models.DecimalField(max_digits=10, decimal_places=2)
    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default='confirmee'
    )
    present_a_bord = models.BooleanField(default=False)
    en_retard = models.BooleanField(default=False)
    date_reservation = models.DateTimeField(auto_now_add=True)
    date_annulation = models.DateTimeField(null=True, blank=True)

    # ── Titulaire du billet vs compte réservateur ──────────────────
    # `passager` (ci-dessus) reste TOUJOURS le compte qui a effectué
    # la réservation (celui qui paie, celui qui peut l'annuler, etc.).
    # Les champs suivants permettent de préciser QUI voyage réellement,
    # quand ce n'est pas le titulaire du compte lui-même.
    type_reservation = models.CharField(
        max_length=20,
        choices=TYPE_RESERVATION_CHOICES,
        default='soi_meme'
    )
    beneficiaire_nom = models.CharField(max_length=100, null=True, blank=True)
    beneficiaire_prenom = models.CharField(max_length=100, null=True, blank=True)
    beneficiaire_telephone = models.CharField(max_length=20, null=True, blank=True)

    # ── Identifiant du billet (utilisé pour le QR code) ────────────
    code_billet = models.CharField(
        max_length=20,
        unique=True,
        default=generer_code_billet,
        editable=False,
    )

    # ── Regroupement des réservations faites en une seule commande ─
    # Quand un compte réserve plusieurs sièges en une seule fois (par
    # exemple 3 places sur le même trajet), chaque siège crée sa
    # propre ligne Reservation, mais toutes partagent le même
    # groupe_reservation (généré côté frontend juste avant l'envoi).
    # Ça permet de régénérer un seul billet PDF listant tous les
    # sièges, plutôt qu'un billet séparé par siège.
    # Champ facultatif : les réservations créées avant cette
    # fonctionnalité (ou faites individuellement) auront simplement
    # groupe_reservation = None, et continueront à fonctionner avec
    # le billet individuel existant.
    groupe_reservation = models.CharField(
        max_length=40, null=True, blank=True, db_index=True
    )

    def __str__(self):
        return f"Réservation {self.id} — {self.passager} — {self.trajet}"

    def nom_titulaire(self):
        """
        Retourne le nom complet de la personne qui voyage réellement
        (le titulaire du billet), que ce soit le compte réservateur
        lui-même ou une autre personne renseignée manuellement.
        """
        if self.type_reservation == 'autre_personne':
            return f"{self.beneficiaire_prenom} {self.beneficiaire_nom}".strip()
        return f"{self.passager.prenom} {self.passager.nom}".strip()


class Paiement(models.Model):
    STATUT_CHOICES = (
        ('en_attente', 'En attente'),
        ('verse', 'Versé'),
        ('rembourse', 'Remboursé'),
    )
    OPERATEUR_CHOICES = (
        ('mvola', 'MVola'),
        ('orange_money', 'Orange Money'),
        ('airtel_money', 'Airtel Money'),
    )
    reservation = models.OneToOneField(
        Reservation, on_delete=models.CASCADE,
        related_name='paiement'
    )
    montant_passager = models.DecimalField(max_digits=10, decimal_places=2)
    operateur = models.CharField(max_length=20, choices=OPERATEUR_CHOICES)
    numero_telephone = models.CharField(max_length=20)
    commission_taux = models.DecimalField(
        max_digits=5, decimal_places=2, default=10.00
    )
    commission_montant = models.DecimalField(max_digits=10, decimal_places=2)
    montant_conducteur = models.DecimalField(max_digits=10, decimal_places=2)
    statut_escrow = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default='en_attente'
    )
    date_paiement = models.DateTimeField(auto_now_add=True)
    date_versement = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Paiement {self.id} — {self.montant_passager} Ar"