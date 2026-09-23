from django.apps import AppConfig


class VehiculesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'vehicules'

    def ready(self):
        # Démarre le scheduler automatiquement au lancement de Django
        from vehicules.scheduler import demarrer_scheduler
        demarrer_scheduler()