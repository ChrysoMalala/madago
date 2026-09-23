from django.db import models
from utilisateurs.models import Utilisateur


class Notification(models.Model):
    TYPE_CHOICES = (
        # ── Réservations ──────────────────────────────────────────
        ('reservation_confirmee',    'Réservation confirmée'),
        ('reservation_annulee',      'Réservation annulée'),
        ('reservation_remboursee',   'Réservation remboursée'),

        # ── Paiements ─────────────────────────────────────────────
        ('paiement_recu',            'Paiement reçu'),
        ('revenu_transfere',         'Revenu transféré'),
        ('remboursement_effectue',   'Remboursement effectué'),

        # ── Trajets ───────────────────────────────────────────────
        ('trajet_depart_confirme',   'Départ confirmé'),
        ('trajet_termine',           'Trajet terminé'),
        ('trajet_annule',            'Trajet annulé'),
        ('rappel_depart',            'Rappel de départ'),

        # ── Validation conducteur ──────────────────────────────────
        ('conducteur_valide',        'Dossier conducteur validé'),
        ('conducteur_rejete',        'Dossier conducteur rejeté'),
        ('conducteur_en_attente',    'Dossier en attente de validation'),

        # ── Validation véhicule ────────────────────────────────────
        ('vehicule_valide',          'Véhicule validé'),
        ('vehicule_rejete',          'Véhicule rejeté'),
        ('vehicule_suspendu',        'Véhicule suspendu'),
        ('vehicule_en_attente',      'Véhicule en attente de validation'),

        # ── Documents expirés ──────────────────────────────────────
        ('assurance_expiree',        'Assurance expirée'),
        ('assurance_bientot',        'Assurance bientôt expirée'),
        ('visite_expiree',           'Visite technique expirée'),
        ('visite_bientot',           'Visite technique bientôt expirée'),

        # ── Système ───────────────────────────────────────────────
        ('message_plateforme',       'Message de la plateforme'),
        ('autre',                    'Autre'),
    )

    utilisateur = models.ForeignKey(
        Utilisateur,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    type_notification = models.CharField(
        max_length=50,
        choices=TYPE_CHOICES,
        default='autre'
    )
    titre = models.CharField(max_length=150)
    message = models.TextField()
    lu = models.BooleanField(default=False)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_creation']

    def __str__(self):
        return f"{self.titre} — {self.utilisateur}"