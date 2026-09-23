from django.utils import timezone
from .models import Vehicule
from conducteurs.models import HistoriqueAction

# Paliers auxquels un rappel est envoyé avant l'expiration réelle.
# Comme la vérification tourne une fois par jour, chaque palier
# n'est atteint qu'UNE SEULE FOIS par véhicule (le nombre de jours
# restants diminue de 1 chaque jour) — pas besoin de mémoriser les
# rappels déjà envoyés dans un champ séparé.
# Limite connue : si le serveur est arrêté au moment précis où un
# palier est atteint, ce rappel-là sera manqué (le suivant sera
# envoyé normalement, sauf pour le tout dernier palier).
SEUILS_RAPPEL_JOURS = [30, 15, 7, 3, 1]


def verifier_expirations():
    """
    Tâche quotidienne (minuit) :
    1. Passe en statut 'expire' les véhicules validés dont l'assurance
       ou la visite technique a dépassé sa date d'expiration — ils
       deviennent alors inutilisables pour publier ou effectuer un
       trajet, jusqu'à mise à jour des documents ET revalidation par
       l'administrateur.
    2. Envoie des notifications de rappel aux conducteurs dont un
       véhicule encore valide approche d'une échéance.
    """
    aujourd_hui = timezone.now().date()

    nb_expires = _traiter_vehicules_expires(aujourd_hui)
    nb_rappels = _envoyer_rappels_expiration(aujourd_hui)

    print(
        f"[CRON] {nb_expires} véhicule(s) passé(s) en expiré, "
        f"{nb_rappels} rappel(s) d'expiration envoyé(s)."
    )


def _traiter_vehicules_expires(aujourd_hui):
    vehicules_a_expirer = (
        Vehicule.objects.filter(
            statut_validation='valide',
            date_expiration_assurance__lt=aujourd_hui,
        ) | Vehicule.objects.filter(
            statut_validation='valide',
            date_expiration_visite__lt=aujourd_hui,
        )
    ).distinct()

    for vehicule in vehicules_a_expirer:
        raisons = []
        if vehicule.date_expiration_assurance < aujourd_hui:
            jours = (aujourd_hui - vehicule.date_expiration_assurance).days
            raisons.append(f"assurance expirée depuis {jours}j")
        if vehicule.date_expiration_visite < aujourd_hui:
            jours = (aujourd_hui - vehicule.date_expiration_visite).days
            raisons.append(f"visite technique expirée depuis {jours}j")

        raison_texte = " et ".join(raisons)

        vehicule.statut_validation = 'expire'
        vehicule.motif_rejet = f"Expiration automatique : {raison_texte}"
        vehicule.save()

        HistoriqueAction.objects.create(
            action='expiration_vehicule',
            conducteur=vehicule.conducteur,
            admin=None,  # Action automatique, pas d'admin à l'origine
            description=(
                f"Passage automatique en expiré du véhicule "
                f"{vehicule.marque} {vehicule.modele} "
                f"({vehicule.immatriculation}) : {raison_texte}"
            ),
        )

        _notifier_conducteur(
            vehicule,
            titre=f"Véhicule expiré — {vehicule.immatriculation}",
            message=(
                f"Votre véhicule {vehicule.marque} {vehicule.modele} "
                f"({vehicule.immatriculation}) est désormais inutilisable "
                f"pour publier ou effectuer des trajets : {raison_texte}. "
                f"Mettez à jour vos documents pour le faire revalider "
                f"par l'administrateur."
            ),
            type_notification='vehicule_expire',
        )

    return vehicules_a_expirer.count()


def _envoyer_rappels_expiration(aujourd_hui):
    """
    Envoie un rappel quand il reste exactement 30, 15, 7, 3 ou 1
    jour(s) avant l'expiration de l'assurance ou de la visite
    technique d'un véhicule encore valide.
    """
    compteur = 0
    vehicules_valides = Vehicule.objects.filter(statut_validation='valide')

    for vehicule in vehicules_valides:
        jours_assurance = (vehicule.date_expiration_assurance - aujourd_hui).days
        jours_visite = (vehicule.date_expiration_visite - aujourd_hui).days

        if jours_assurance in SEUILS_RAPPEL_JOURS:
            _notifier_conducteur(
                vehicule,
                titre=f"Assurance bientôt expirée — {vehicule.immatriculation}",
                message=(
                    f"L'assurance de votre véhicule {vehicule.marque} "
                    f"{vehicule.modele} ({vehicule.immatriculation}) expire "
                    f"dans {jours_assurance} jour(s). Pensez à la renouveler "
                    f"et à mettre à jour vos documents avant cette date, "
                    f"sinon le véhicule sera automatiquement mis en pause."
                ),
                type_notification='vehicule_alerte_expiration',
            )
            compteur += 1

        if jours_visite in SEUILS_RAPPEL_JOURS:
            _notifier_conducteur(
                vehicule,
                titre=f"Visite technique bientôt expirée — {vehicule.immatriculation}",
                message=(
                    f"La visite technique de votre véhicule {vehicule.marque} "
                    f"{vehicule.modele} ({vehicule.immatriculation}) expire "
                    f"dans {jours_visite} jour(s). Pensez à la renouveler "
                    f"et à mettre à jour vos documents avant cette date, "
                    f"sinon le véhicule sera automatiquement mis en pause."
                ),
                type_notification='vehicule_alerte_expiration',
            )
            compteur += 1

    return compteur


def _notifier_conducteur(vehicule, titre, message, type_notification):
    try:
        from notifications.models import Notification
        Notification.objects.create(
            utilisateur=vehicule.conducteur.utilisateur,
            type_notification=type_notification,
            titre=titre,
            message=message,
        )
    except Exception as e:
        print(f"[CRON] Erreur notification : {e}")