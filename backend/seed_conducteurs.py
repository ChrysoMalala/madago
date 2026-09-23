import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from utilisateurs.models import Utilisateur
from conducteurs.models import Conducteur
from vehicules.models import Vehicule

# ── Données des conducteurs ───────────────────────────────────────
CONDUCTEURS = [
    {
        'utilisateur': {
            'email': 'rakoto.jean@gmail.com',
            'mot_de_passe': 'Rakoto2000!',
            'nom': 'Rakoto',
            'prenom': 'Jean',
            'telephone': '0341234567',
        },
        'profil': {
            'date_naissance': '1990-05-15',
            'lieu_naissance': 'Antananarivo',
            'numero_cin': '101234567890',
            'numero_permis': 'PERM-001-2020',
            'categorie_permis': 'B',
            'contact_urgence_nom': 'Rakoto Marie',
            'contact_urgence_telephone': '0341234568',
            'operateur_mobile_money': 'mvola',
            'numero_mobile_money': '0341234567',
            'titulaire_mobile_money': 'Rakoto Jean',
            'statut_validation': 'valide',
        },
        'vehicules': [
            {
                'type_vehicule': 'taxi_brousse',
                'marque': 'Toyota',
                'modele': 'Hiace',
                'annee': 2015,
                'couleur': 'Blanc',
                'immatriculation': '1234 TAB',
                'nombre_places': 15,
                'type_carburant': 'diesel',
                'numero_assurance': 'ASS-001-2024',
                'date_expiration_assurance': '2026-12-31',
                'date_visite_technique': '2026-01-15',
                'date_expiration_visite': '2027-01-15',
                'statut_validation': 'valide',
            },
            {
                'type_vehicule': 'voiture_privee',
                'marque': 'Peugeot',
                'modele': '308',
                'annee': 2018,
                'couleur': 'Gris',
                'immatriculation': '5678 TAB',
                'nombre_places': 5,
                'type_carburant': 'essence',
                'numero_assurance': 'ASS-002-2024',
                'date_expiration_assurance': '2026-11-30',
                'date_visite_technique': '2026-02-20',
                'date_expiration_visite': '2027-02-20',
                'statut_validation': 'valide',
            },
            {
                'type_vehicule': 'autocar',
                'marque': 'Mercedes',
                'modele': 'Sprinter',
                'annee': 2012,
                'couleur': 'Bleu',
                'immatriculation': '9012 TAB',
                'nombre_places': 25,
                'type_carburant': 'diesel',
                'numero_assurance': 'ASS-003-2024',
                'date_expiration_assurance': '2026-10-15',
                'date_visite_technique': '2026-03-10',
                'date_expiration_visite': '2027-03-10',
                'statut_validation': 'en_attente',
            },
        ],
    },
    {
        'utilisateur': {
            'email': 'rasoa.marie@gmail.com',
            'mot_de_passe': 'Rasoa2000!',
            'nom': 'Rasoa',
            'prenom': 'Marie',
            'telephone': '0321234567',
        },
        'profil': {
            'date_naissance': '1985-08-22',
            'lieu_naissance': 'Toamasina',
            'numero_cin': '202345678901',
            'numero_permis': 'PERM-002-2019',
            'categorie_permis': 'D',
            'contact_urgence_nom': 'Rasoa Paul',
            'contact_urgence_telephone': '0321234568',
            'operateur_mobile_money': 'orange_money',
            'numero_mobile_money': '0321234567',
            'titulaire_mobile_money': 'Rasoa Marie',
            'statut_validation': 'valide',
        },
        'vehicules': [
            {
                'type_vehicule': 'taxi_brousse',
                'marque': 'Renault',
                'modele': 'Master',
                'annee': 2016,
                'couleur': 'Jaune',
                'immatriculation': '2345 TCD',
                'nombre_places': 18,
                'type_carburant': 'diesel',
                'numero_assurance': 'ASS-004-2024',
                'date_expiration_assurance': '2026-09-30',
                'date_visite_technique': '2026-04-05',
                'date_expiration_visite': '2027-04-05',
                'statut_validation': 'valide',
            },
            {
                'type_vehicule': 'voiture_privee',
                'marque': 'Nissan',
                'modele': 'Almera',
                'annee': 2019,
                'couleur': 'Rouge',
                'immatriculation': '6789 TCD',
                'nombre_places': 5,
                'type_carburant': 'essence',
                'numero_assurance': 'ASS-005-2024',
                'date_expiration_assurance': '2027-01-31',
                'date_visite_technique': '2026-05-15',
                'date_expiration_visite': '2027-05-15',
                'statut_validation': 'valide',
            },
            {
                'type_vehicule': 'taxi_brousse',
                'marque': 'Ford',
                'modele': 'Transit',
                'annee': 2014,
                'couleur': 'Blanc',
                'immatriculation': '0123 TCD',
                'nombre_places': 12,
                'type_carburant': 'diesel',
                'numero_assurance': 'ASS-006-2024',
                'date_expiration_assurance': '2026-08-20',
                'date_visite_technique': '2026-06-01',
                'date_expiration_visite': '2027-06-01',
                'statut_validation': 'rejete',
                'motif_rejet': 'Documents illisibles',
            },
        ],
    },
    {
        'utilisateur': {
            'email': 'rabe.paul@gmail.com',
            'mot_de_passe': 'Rabe2000!',
            'nom': 'Rabe',
            'prenom': 'Paul',
            'telephone': '0331234567',
        },
        'profil': {
            'date_naissance': '1992-03-10',
            'lieu_naissance': 'Mahajanga',
            'numero_cin': '303456789012',
            'numero_permis': 'PERM-003-2021',
            'categorie_permis': 'B',
            'contact_urgence_nom': 'Rabe Sophie',
            'contact_urgence_telephone': '0331234568',
            'operateur_mobile_money': 'airtel_money',
            'numero_mobile_money': '0331234567',
            'titulaire_mobile_money': 'Rabe Paul',
            'statut_validation': 'en_attente',
        },
        'vehicules': [
            {
                'type_vehicule': 'voiture_privee',
                'marque': 'Honda',
                'modele': 'Civic',
                'annee': 2020,
                'couleur': 'Noir',
                'immatriculation': '3456 TMH',
                'nombre_places': 5,
                'type_carburant': 'essence',
                'numero_assurance': 'ASS-007-2024',
                'date_expiration_assurance': '2027-03-31',
                'date_visite_technique': '2026-07-10',
                'date_expiration_visite': '2027-07-10',
                'statut_validation': 'en_attente',
            },
            {
                'type_vehicule': 'taxi_brousse',
                'marque': 'Hyundai',
                'modele': 'H1',
                'annee': 2017,
                'couleur': 'Argent',
                'immatriculation': '7890 TMH',
                'nombre_places': 10,
                'type_carburant': 'diesel',
                'numero_assurance': 'ASS-008-2024',
                'date_expiration_assurance': '2026-12-15',
                'date_visite_technique': '2026-08-20',
                'date_expiration_visite': '2027-08-20',
                'statut_validation': 'en_attente',
            },
            {
                'type_vehicule': 'autocar',
                'marque': 'Mitsubishi',
                'modele': 'Rosa',
                'annee': 2013,
                'couleur': 'Vert',
                'immatriculation': '1234 TMH',
                'nombre_places': 30,
                'type_carburant': 'diesel',
                'numero_assurance': 'ASS-009-2024',
                'date_expiration_assurance': '2026-11-01',
                'date_visite_technique': '2026-09-05',
                'date_expiration_visite': '2027-09-05',
                'statut_validation': 'en_attente',
            },
        ],
    },
    {
        'utilisateur': {
            'email': 'raivo.luc@gmail.com',
            'mot_de_passe': 'Raivo2000!',
            'nom': 'Raivo',
            'prenom': 'Luc',
            'telephone': '0341112233',
        },
        'profil': {
            'date_naissance': '1988-11-25',
            'lieu_naissance': 'Fianarantsoa',
            'numero_cin': '404567890123',
            'numero_permis': 'PERM-004-2018',
            'categorie_permis': 'D',
            'contact_urgence_nom': 'Raivo Clara',
            'contact_urgence_telephone': '0341112234',
            'operateur_mobile_money': 'mvola',
            'numero_mobile_money': '0341112233',
            'titulaire_mobile_money': 'Raivo Luc',
            'statut_validation': 'valide',
        },
        'vehicules': [
            {
                'type_vehicule': 'taxi_brousse',
                'marque': 'Isuzu',
                'modele': 'NQR',
                'annee': 2011,
                'couleur': 'Blanc',
                'immatriculation': '5678 TFN',
                'nombre_places': 20,
                'type_carburant': 'diesel',
                'numero_assurance': 'ASS-010-2024',
                'date_expiration_assurance': '2026-12-01',
                'date_visite_technique': '2026-10-15',
                'date_expiration_visite': '2027-10-15',
                'statut_validation': 'valide',
            },
            {
                'type_vehicule': 'voiture_privee',
                'marque': 'Kia',
                'modele': 'Picanto',
                'annee': 2021,
                'couleur': 'Bleu',
                'immatriculation': '9012 TFN',
                'nombre_places': 5,
                'type_carburant': 'essence',
                'numero_assurance': 'ASS-011-2024',
                'date_expiration_assurance': '2027-06-30',
                'date_visite_technique': '2026-11-20',
                'date_expiration_visite': '2027-11-20',
                'statut_validation': 'valide',
            },
            {
                'type_vehicule': 'taxi_brousse',
                'marque': 'Volkswagen',
                'modele': 'Crafter',
                'annee': 2016,
                'couleur': 'Gris',
                'immatriculation': '3456 TFN',
                'nombre_places': 16,
                'type_carburant': 'diesel',
                'numero_assurance': 'ASS-012-2024',
                'date_expiration_assurance': '2026-09-15',
                'date_visite_technique': '2026-12-01',
                'date_expiration_visite': '2027-12-01',
                'statut_validation': 'suspendu',
            },
        ],
    },
    {
        'utilisateur': {
            'email': 'randr.sophie@gmail.com',
            'mot_de_passe': 'Randr2000!',
            'nom': 'Randriamanana',
            'prenom': 'Sophie',
            'telephone': '0322223344',
        },
        'profil': {
            'date_naissance': '1995-07-04',
            'lieu_naissance': 'Antsiranana',
            'numero_cin': '505678901234',
            'numero_permis': 'PERM-005-2022',
            'categorie_permis': 'B',
            'contact_urgence_nom': 'Randriamanana Eric',
            'contact_urgence_telephone': '0322223345',
            'operateur_mobile_money': 'orange_money',
            'numero_mobile_money': '0322223344',
            'titulaire_mobile_money': 'Randriamanana Sophie',
            'statut_validation': 'rejete',
            'motif_rejet': 'Numéro CIN non conforme',
        },
        'vehicules': [
            {
                'type_vehicule': 'voiture_privee',
                'marque': 'Suzuki',
                'modele': 'Swift',
                'annee': 2019,
                'couleur': 'Rouge',
                'immatriculation': '7890 TDS',
                'nombre_places': 5,
                'type_carburant': 'essence',
                'numero_assurance': 'ASS-013-2024',
                'date_expiration_assurance': '2027-02-28',
                'date_visite_technique': '2027-01-10',
                'date_expiration_visite': '2028-01-10',
                'statut_validation': 'en_attente',
            },
            {
                'type_vehicule': 'taxi_brousse',
                'marque': 'Fiat',
                'modele': 'Ducato',
                'annee': 2015,
                'couleur': 'Blanc',
                'immatriculation': '1234 TDS',
                'nombre_places': 14,
                'type_carburant': 'diesel',
                'numero_assurance': 'ASS-014-2024',
                'date_expiration_assurance': '2026-10-31',
                'date_visite_technique': '2027-02-15',
                'date_expiration_visite': '2028-02-15',
                'statut_validation': 'en_attente',
            },
            {
                'type_vehicule': 'autocar',
                'marque': 'Scania',
                'modele': 'K310',
                'annee': 2010,
                'couleur': 'Bleu',
                'immatriculation': '5678 TDS',
                'nombre_places': 45,
                'type_carburant': 'diesel',
                'numero_assurance': 'ASS-015-2024',
                'date_expiration_assurance': '2026-08-31',
                'date_visite_technique': '2027-03-20',
                'date_expiration_visite': '2028-03-20',
                'statut_validation': 'en_attente',
            },
        ],
    },
]


def creer_conducteurs():
    print("🚀 Création des conducteurs...")
    created = 0
    skipped = 0

    for data in CONDUCTEURS:
        email = data['utilisateur']['email']

        # Vérifier si l'utilisateur existe déjà
        if Utilisateur.objects.filter(email=email).exists():
            print(f"  ⏭️  {email} existe déjà — ignoré")
            skipped += 1
            continue

        # Créer l'utilisateur
        u = Utilisateur.objects.create_user(
            email=email,
            password=data['utilisateur']['mot_de_passe'],
            nom=data['utilisateur']['nom'],
            prenom=data['utilisateur']['prenom'],
            telephone=data['utilisateur']['telephone'],
        )

        # Créer le profil conducteur
        profil_data = data['profil'].copy()
        conducteur = Conducteur.objects.create(
            utilisateur=u,
            **profil_data
        )

        # Créer les véhicules
        for v_data in data['vehicules']:
            Vehicule.objects.create(
                conducteur=conducteur,
                equipements='Climatisation, USB',
                **v_data
            )

        print(f"  ✅ {u.prenom} {u.nom} ({email}) — {len(data['vehicules'])} véhicules créés")
        created += 1

    print(f"\n✅ Terminé ! {created} conducteur(s) créé(s), {skipped} ignoré(s).")


if __name__ == '__main__':
    creer_conducteurs()