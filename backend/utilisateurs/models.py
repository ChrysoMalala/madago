from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UtilisateurManager(BaseUserManager):
    def create_user(self, email, mot_de_passe=None, **extra_fields):
        if not email:
            raise ValueError("L'adresse e-mail est obligatoire")
        email = self.normalize_email(email)
        utilisateur = self.model(email=email, **extra_fields)
        utilisateur.set_password(mot_de_passe)
        utilisateur.save(using=self._db)
        return utilisateur

    def create_superuser(self, email, mot_de_passe=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, mot_de_passe, **extra_fields)


class Utilisateur(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('passager', 'Passager'),
        ('conducteur', 'Conducteur'),
    )

    # ── Préférences d'affichage ─────────────────────────────────────
    # Rattachées au compte (et non juste au navigateur), pour que
    # l'utilisateur retrouve ses préférences peu importe l'appareil
    # utilisé pour se connecter.
    LANGUE_CHOICES = (
        ('fr', 'Français'),
        ('mg', 'Malagasy'),
    )
    THEME_CHOICES = (
        ('clair', 'Clair'),
        ('sombre', 'Sombre'),
    )

    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    telephone = models.CharField(max_length=20)
    photo_profil = models.ImageField(upload_to='photos_profil/', null=True, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    est_actif = models.BooleanField(default=True)
    date_inscription = models.DateTimeField(auto_now_add=True)
    derniere_connexion = models.DateTimeField(null=True, blank=True)
    langue = models.CharField(max_length=5, choices=LANGUE_CHOICES, default='fr')
    theme = models.CharField(max_length=10, choices=THEME_CHOICES, default='clair')

    is_staff = models.BooleanField(default=False)

    objects = UtilisateurManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nom', 'prenom']

    def __str__(self):
        return f"{self.prenom} {self.nom} ({self.email})"