from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from django.conf import settings


def demarrer_scheduler():
    from vehicules.cron import verifier_expirations

    scheduler = BackgroundScheduler()

    # Vérification chaque jour à minuit
    scheduler.add_job(
        verifier_expirations,
        trigger=CronTrigger(hour=0, minute=0),
        id='verifier_expirations',
        name='Vérification expiration documents véhicules',
        replace_existing=True,
    )

    scheduler.start()
    print("[SCHEDULER] Tâche planifiée démarrée — vérification chaque jour à minuit.")