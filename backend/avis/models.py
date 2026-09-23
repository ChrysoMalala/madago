from django.db import models
from utilisateurs.models import Utilisateur
from conducteurs.models import Conducteur
from reservations.models import Reservation


class Avis(models.Model):
    reservation = models.OneToOneField(
        Reservation, on_delete=models.CASCADE,
        related_name='avis'
    )
    passager = models.ForeignKey(
        Utilisateur, on_delete=models.CASCADE,
        related_name='avis_donnes'
    )
    conducteur = models.ForeignKey(
        Conducteur, on_delete=models.CASCADE,
        related_name='avis_recus'
    )
    note = models.IntegerField()
    commentaire = models.TextField(null=True, blank=True)
    date_avis = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Avis {self.note}/5 — {self.passager} {self.conducteur}"