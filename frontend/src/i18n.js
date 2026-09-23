/**
 * Système de traduction léger, sans dépendance externe.
 *
 * Fonctionnement : chaque texte de l'application est identifié par
 * une clé (ex: 'nav_accueil'), et cette clé pointe vers sa version
 * française et sa version malagasy ci-dessous. La fonction t(cle)
 * retourne le texte dans la langue actuellement sélectionnée.
 *
 * IMPORTANT : ce fichier ne contient pour l'instant que les clés
 * nécessaires à l'infrastructure elle-même (navigation générale).
 * Le reste du texte de l'application sera traduit progressivement,
 * page par page — il suffit d'ajouter de nouvelles clés ici au fur
 * et à mesure, puis de remplacer le texte en dur dans chaque page
 * par un appel à t('ma_nouvelle_cle').
 */

export const TRADUCTIONS = {
  fr: {
    nav_accueil: 'Accueil',
    nav_recherche: 'Recherche',
    nav_mes_reservations: 'Mes réservations',
    nav_mes_trajets: 'Mes trajets',
    nav_mes_vehicules: 'Mes véhicules',
    nav_profil: 'Mon profil',
    nav_deconnexion: 'Déconnexion',
    nav_connexion: 'Connexion',
    nav_inscription: "S'inscrire",
    nav_devenir_conducteur: 'Devenir conducteur',
    nav_espace_passager: 'Espace passager',
    nav_espace_conducteur: 'Espace conducteur',
    nav_demande_en_attente: 'Demande conducteur (En attente)',
    nav_demande_rejetee: 'Demande conducteur (Rejetée)',
    nav_notifications: 'Notifications',
    nav_tout_marquer_lu: 'Tout marquer lu',
    nav_aucune_notification: 'Aucune notification',
    theme_basculer_sombre: 'Passer en mode sombre',
    theme_basculer_clair: 'Passer en mode clair',
    langue_basculer: 'Changer de langue',
  },
  mg: {
    nav_accueil: 'Fandraisana',
    nav_recherche: 'Fikarohana',
    nav_mes_reservations: 'Ny famandrianako',
    nav_mes_trajets: 'Ny diako',
    nav_mes_vehicules: 'Ny fiarako',
    nav_profil: 'Mombamomba ahy',
    nav_deconnexion: 'Hiala',
    nav_connexion: 'Hiditra',
    nav_inscription: 'Hisoratra anarana',
    nav_devenir_conducteur: 'Ho mpamily',
    nav_espace_passager: 'Sehatry ny mpandeha',
    nav_espace_conducteur: 'Sehatry ny mpamily',
    nav_demande_en_attente: 'Fangatahana mpamily (Miandry)',
    nav_demande_rejetee: 'Fangatahana mpamily (Nolavina)',
    nav_notifications: 'Fampandrenesana',
    nav_tout_marquer_lu: 'Marihina ho vakiana daholo',
    nav_aucune_notification: 'Tsy misy fampandrenesana',
    theme_basculer_sombre: 'Mamadika ho maizina',
    theme_basculer_clair: 'Mamadika ho mazava',
    langue_basculer: 'Manova fiteny',
  },
}

/**
 * Retourne le texte correspondant à `cle` dans la langue `langue`.
 * Si la clé n'existe pas pour cette langue (traduction pas encore
 * faite), on retourne la version française par défaut plutôt que
 * d'afficher un texte cassé — et si même le français manque, on
 * retourne la clé elle-même, pour repérer facilement les oublis
 * pendant le développement.
 */
export function traduire(cle, langue) {
  return (
    TRADUCTIONS[langue]?.[cle] ??
    TRADUCTIONS.fr[cle] ??
    cle
  )
}