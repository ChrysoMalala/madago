import requests
from datetime import datetime, timedelta
from math import radians, sin, cos, sqrt, atan2


# ── Constantes ────────────────────────────────────────────────────
VITESSE_MOYENNE_KMH = 40   # Vitesse réaliste Madagascar
MARGE_SECURITE_H    = 1.5  # 1h30 de marge de sécurité


def geocoder_ville(nom_ville):
    """
    Convertit un nom de ville en coordonnées GPS via Nominatim.
    Retourne (lat, lon) ou (None, None) si introuvable.
    """
    try:
        url = (
            f"https://nominatim.openstreetmap.org/search"
            f"?q={nom_ville}, Madagascar"
            f"&format=json&limit=1"
        )
        reponse = requests.get(url, headers={'User-Agent': 'MadaGo/1.0'}, timeout=5)
        data = reponse.json()
        if data:
            return float(data[0]['lat']), float(data[0]['lon'])
    except Exception as e:
        print(f"[GEOCODE] Erreur : {e}")
    return None, None


def distance_routiere_osrm(lat1, lon1, lat2, lon2):
    """
    Calcule la distance routière entre deux points via OSRM.
    Retourne la distance en km ou None si erreur.
    """
    try:
        url = (
            f"https://router.project-osrm.org/route/v1/driving/"
            f"{lon1},{lat1};{lon2},{lat2}"
            f"?overview=false"
        )
        reponse = requests.get(url, timeout=10)
        data = reponse.json()
        if data.get('routes'):
            distance_m = data['routes'][0]['distance']
            return distance_m / 1000  # Convertir en km
    except Exception as e:
        print(f"[OSRM] Erreur : {e}")
    return None


def distance_vol_oiseau(lat1, lon1, lat2, lon2):
    """
    Calcule la distance à vol d'oiseau entre deux points (Haversine).
    Retourne la distance en km.
    """
    R = 6371  # Rayon de la Terre en km
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    return R * 2 * atan2(sqrt(a), sqrt(1-a))


def duree_estimee_heures(distance_km):
    """
    Estime la durée d'un trajet en heures.
    """
    return (distance_km / VITESSE_MOYENNE_KMH) + MARGE_SECURITE_H


def calculer_distance_repositionnement(lat1, lon1, lat2, lon2, distance_fallback_km):
    """
    Calcule la distance de repositionnement entre deux points.

    Ordre de priorité :
    1. OSRM (distance routière réelle) si les coordonnées sont disponibles
    2. Vol d'oiseau x 1.4 (coefficient routier Madagascar) si OSRM échoue
       mais que les coordonnées sont disponibles
    3. distance_fallback_km si AUCUNE coordonnée n'est disponible
       (on utilise une estimation prudente plutôt que de sauter le contrôle)

    Retourne toujours une distance en km (jamais None), pour garantir
    que le contrôle de faisabilité est TOUJOURS effectué.
    """
    coords_disponibles = (
        lat1 is not None and lon1 is not None and
        lat2 is not None and lon2 is not None
    )

    if coords_disponibles:
        dist = distance_routiere_osrm(lat1, lon1, lat2, lon2)
        if dist is not None:
            return dist
        # Fallback vol d'oiseau si OSRM échoue mais coords connues
        return distance_vol_oiseau(lat1, lon1, lat2, lon2) * 1.4

    # Aucune coordonnée disponible : on ne saute JAMAIS le contrôle.
    # On utilise une estimation prudente (distance du trajet voisin)
    # plutôt que d'accepter par défaut.
    print(
        "[REPOSITIONNEMENT] Coordonnées GPS manquantes, "
        f"utilisation du fallback prudent : {distance_fallback_km} km"
    )
    return distance_fallback_km


def verifier_compatibilite_trajets(conducteur, nouveau_trajet_data):
    """
    Vérifie si un nouveau trajet est compatible avec les trajets
    existants du conducteur.

    nouveau_trajet_data = {
        'date_depart':  '2026-08-09',
        'heure_depart': '10:00',
        'distance_km':  165,
        'vehicule_id':  4,
        'lat_depart':   -18.9249,
        'lon_depart':   47.5185,
        'lat_arrivee':  -22.9003,
        'lon_arrivee':  43.7501,
        'ville_depart':  'Antananarivo',
        'ville_arrivee': 'Toliara',
    }

    Retourne {
        'compatible': True/False,
        'type': 'vehicule' | 'conducteur' | None,
        'message': str
    }
    """
    from .models import Trajet

    # ── Parser le datetime du nouveau trajet ──────────────────────
    heure_str = nouveau_trajet_data['heure_depart']
    date_str  = nouveau_trajet_data['date_depart']

    # Accepte HH:MM ou HH:MM:SS
    for fmt in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M'):
        try:
            nouveau_depart = datetime.strptime(f"{date_str} {heure_str}", fmt)
            break
        except ValueError:
            continue
    else:
        return {'compatible': True, 'message': ''}

    distance_km  = int(nouveau_trajet_data.get('distance_km', 0))
    vehicule_id  = str(nouveau_trajet_data.get('vehicule_id', ''))
    lat_dep_new  = nouveau_trajet_data.get('lat_depart')
    lon_dep_new  = nouveau_trajet_data.get('lon_depart')
    lat_arr_new  = nouveau_trajet_data.get('lat_arrivee')
    lon_arr_new  = nouveau_trajet_data.get('lon_arrivee')

    duree_nouveau    = duree_estimee_heures(distance_km)
    nouveau_fin      = nouveau_depart + timedelta(hours=duree_nouveau)

    # ── Récupérer tous les trajets actifs du conducteur ───────────
    trajets_actifs = Trajet.objects.filter(
        conducteur=conducteur,
        statut__in=['a_venir', 'en_cours'],
    ).order_by('date_depart', 'heure_depart')

    for t in trajets_actifs:
        # Parser le datetime du trajet existant
        for fmt in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M'):
            try:
                t_depart = datetime.strptime(
                    f"{t.date_depart} {t.heure_depart}", fmt
                )
                break
            except ValueError:
                continue
        else:
            continue

        t_duree   = duree_estimee_heures(t.distance_km)
        t_fin     = t_depart + timedelta(hours=t_duree)

        # ── Cas 1 : Chevauchement direct ──────────────────────────
        chevauchement = (nouveau_depart < t_fin and nouveau_fin > t_depart)

        if chevauchement:
            # Conflit véhicule
            if str(t.vehicule.id) == vehicule_id:
                return {
                    'compatible': False,
                    'type': 'vehicule',
                    'message': (
                        f"⚠️ Publication impossible\n"
                        f"Votre véhicule est déjà affecté au trajet "
                        f"{t.ville_depart} → {t.ville_arrivee} "
                        f"(départ {str(t.heure_depart)[:5]}, "
                        f"fin estimée {t_fin.strftime('%d/%m à %H:%M')}). "
                        f"Ce véhicule n'est pas disponible pour votre "
                        f"nouveau trajet à {nouveau_depart.strftime('%H:%M')}."
                    )
                }
            # Conflit conducteur
            return {
                'compatible': False,
                'type': 'conducteur',
                'message': (
                    f"⚠️ Publication impossible\n"
                    f"Vous êtes déjà engagé sur le trajet "
                    f"{t.ville_depart} → {t.ville_arrivee} "
                    f"jusqu'au {t_fin.strftime('%d/%m à %H:%M')}. "
                    f"Votre nouveau trajet à {nouveau_depart.strftime('%H:%M')} "
                    f"chevauche cette période."
                )
            }

        # ── Cas 2 : Trajet précédent (t se termine avant nouveau) ─
        if t_fin <= nouveau_depart:
            temps_dispo = (nouveau_depart - t_fin).total_seconds() / 3600

            # Distance de repositionnement : ville arrivée du trajet
            # précédent → ville départ du nouveau trajet.
            # Le fallback prudent utilise la distance du trajet précédent
            # (t.distance_km) si aucune coordonnée GPS n'est disponible :
            # c'est une estimation volontairement pessimiste, pour ne
            # JAMAIS accepter un trajet par défaut faute de données.
            dist_repo = calculer_distance_repositionnement(
                t.lat_arrivee, t.lon_arrivee,
                lat_dep_new, lon_dep_new,
                distance_fallback_km=t.distance_km,
            )

            duree_repo = dist_repo / VITESSE_MOYENNE_KMH

            if temps_dispo < duree_repo + MARGE_SECURITE_H:
                return {
                    'compatible': False,
                    'type': 'repositionnement',
                    'message': (
                        f"⚠️ Publication impossible\n"
                        f"Après votre trajet {t.ville_depart} → {t.ville_arrivee} "
                        f"(fin estimée {t_fin.strftime('%d/%m à %H:%M')}), "
                        f"vous disposez de {temps_dispo:.1f}h pour rejoindre "
                        f"{nouveau_trajet_data['ville_depart']}. "
                        f"Le trajet de repositionnement depuis "
                        f"{t.ville_arrivee} est estimé à "
                        f"{duree_repo:.1f}h + {MARGE_SECURITE_H}h de marge "
                        f"= {duree_repo + MARGE_SECURITE_H:.1f}h nécessaires. "
                        f"Le temps disponible est insuffisant."
                    )
                }

        # ── Cas 3 : Trajet suivant (t démarre après nouveau) ──────
        if t_depart >= nouveau_fin:
            temps_dispo = (t_depart - nouveau_fin).total_seconds() / 3600

            dist_repo = calculer_distance_repositionnement(
                lat_arr_new, lon_arr_new,
                t.lat_depart, t.lon_depart,
                distance_fallback_km=distance_km,
            )

            duree_repo = dist_repo / VITESSE_MOYENNE_KMH

            if temps_dispo < duree_repo + MARGE_SECURITE_H:
                return {
                    'compatible': False,
                    'type': 'repositionnement_suivant',
                    'message': (
                        f"⚠️ Publication impossible\n"
                        f"Après ce nouveau trajet "
                        f"(fin estimée {nouveau_fin.strftime('%d/%m à %H:%M')}), "
                        f"vous n'aurez pas assez de temps pour rejoindre "
                        f"{t.ville_depart} avant votre trajet suivant "
                        f"({t.ville_depart} → {t.ville_arrivee} "
                        f"à {str(t.heure_depart)[:5]}). "
                        f"Repositionnement estimé : {duree_repo:.1f}h "
                        f"+ {MARGE_SECURITE_H}h de marge."
                    )
                }

        # ── Cas 4 : Conflit du VÉHICULE avec un autre trajet du
        #            même conducteur mais un véhicule différent,
        #            sans chevauchement horaire direct.
        #            (Le véhicule est indisponible même hors
        #            chevauchement s'il n'a pas eu le temps de se
        #            repositionner lui aussi — non couvert ici car
        #            un véhicule ne "se déplace" pas seul ; c'est
        #            couvert par le contrôle conducteur ci-dessus
        #            quand vehicule_id est identique.)

    # ── Vérification véhicule utilisé par un AUTRE conducteur ─────
    trajets_vehicule = Trajet.objects.filter(
        vehicule_id=vehicule_id,
        statut__in=['a_venir', 'en_cours'],
    ).exclude(conducteur=conducteur)

    for t in trajets_vehicule:
        for fmt in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M'):
            try:
                t_depart = datetime.strptime(
                    f"{t.date_depart} {t.heure_depart}", fmt
                )
                break
            except ValueError:
                continue
        else:
            continue

        t_duree = duree_estimee_heures(t.distance_km)
        t_fin   = t_depart + timedelta(hours=t_duree)

        if nouveau_depart < t_fin and nouveau_fin > t_depart:
            return {
                'compatible': False,
                'type': 'vehicule_autre_conducteur',
                'message': (
                    f"⚠️ Publication impossible\n"
                    f"Ce véhicule est utilisé par un autre conducteur "
                    f"pour le trajet {t.ville_depart} → {t.ville_arrivee} "
                    f"jusqu'au {t_fin.strftime('%d/%m à %H:%M')}."
                )
            }

    # ── Tout est compatible ───────────────────────────────────────
    ville_dep = nouveau_trajet_data.get('ville_depart', '')
    ville_arr = nouveau_trajet_data.get('ville_arrivee', '')
    return {
        'compatible': True,
        'type': None,
        'message': (
            f"✅ Trajet compatible\n"
            f"Le conducteur et le véhicule sont disponibles. "
            f"L'enchaînement avec vos autres trajets est réalisable. "
            f"Votre trajet {ville_dep} → {ville_arr} "
            f"peut être publié."
        )
    }