import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Spinner from "../../components/Spinner";
import MessageErreur from "../../components/MessageErreur";
import AlerteBlocage from "../../components/AlerteBlocage";
import api from "../../api/axios";
import CarteItineraire from "../../components/CarteItineraire";
import PlanSieges from "../../components/PlanSieges";

export default function PublierTrajet() {
  const navigate = useNavigate();

  const [etape, setEtape] = useState(1);
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const [vehicules, setVehicules] = useState([]);
  const [chargementVehicules, setChargementVehicules] = useState(true);

  // =====================================================
  // State donnees
  // =====================================================
  const [donnees, setDonnees] = useState({
    ville_depart: "",
    ville_arrivee: "",
    date_depart: "",
    heure_depart: "",
    duree_estimee: "",
    distance_km: null,
    vehicule: "",
    type_tarification: "unique",
    prix_unique: "",
    politique_bagages: "",
    pauses_prevues: "",
    infos_complementaires: "",
  });

  // =====================================================
  // Vérification conflit trajet
  // =====================================================
  const [conflitTrajet, setConflitTrajet] = useState(null);
  const [verificationConflit, setVerificationConflit] = useState(false);

  const [pointsArret, setPointsArret] = useState([]);

  const [nouveauPoint, setNouveauPoint] = useState({
    type_point: "ramassage",
    nom_lieu: "",
  });

  const [sieges, setSieges] = useState([]);
  const [positions, setPositions] = useState({});

  // =====================================================
  // Coordonnées GPS
  // =====================================================
  const [coordDepart, setCoordDepart] = useState(null);
  const [coordArrivee, setCoordArrivee] = useState(null);

  const [chargementCarte, setChargementCarte] = useState(false);
  const [erreurDistance, setErreurDistance] = useState("");

  // =====================================================
  // CONSTANTES DE VITESSE
  // =====================================================
  // Ces valeurs sont utilisées pour l'estimation de durée.
  const VITESSE_MIN = 30;
  const VITESSE_MOYENNE = 55;
  const VITESSE_MAX = 80;

  // =====================================================
  // Calcul automatique de la durée
  // =====================================================
  const calculerDureeEstimee = useCallback((distanceKm) => {
    if (!distanceKm || distanceKm <= 0) {
      return {
        min: null,
        moyenne: null,
        max: null,
      };
    }

    const dureeMinMinutes = Math.ceil((distanceKm / VITESSE_MAX) * 60);

    const dureeMoyenneMinutes = Math.ceil((distanceKm / VITESSE_MOYENNE) * 60);

    const dureeMaxMinutes = Math.ceil((distanceKm / VITESSE_MIN) * 60);

    return {
      min: dureeMinMinutes,
      moyenne: dureeMoyenneMinutes,
      max: dureeMaxMinutes,
    };
  }, []);

  // =====================================================
  // Formatage durée
  // =====================================================
  const formaterDuree = useCallback((minutes) => {
    if (!minutes) return "";

    const heures = Math.floor(minutes / 60);
    const minutesRestantes = minutes % 60;

    if (heures === 0) {
      return `${minutesRestantes} min`;
    }

    if (minutesRestantes === 0) {
      return `${heures} h`;
    }

    return `${heures} h ${String(minutesRestantes).padStart(2, "0")}`;
  }, []);

  // =====================================================
  // Chargement des véhicules
  // =====================================================
  useEffect(() => {
    const chargerVehicules = async () => {
      try {
        const reponse = await api.get("/vehicules/");
        setVehicules(reponse.data);
      } catch (err) {
        console.error(err);
        setErreur("Impossible de charger vos véhicules.");
      } finally {
        setChargementVehicules(false);
      }
    };

    chargerVehicules();
  }, []);

  // =====================================================
  // Géocodage des villes avec Nominatim
  // =====================================================
  const geocoderVille = async (nomVille) => {
    const url =
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(nomVille + ", Madagascar")}` +
      `&format=json&limit=1`;

    const res = await fetch(url, {
      headers: {
        "Accept-Language": "fr",
      },
    });

    const data = await res.json();

    if (data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
      };
    }

    return null;
  };

  // =====================================================
  // Déclenchement du géocodage quand les villes changent
  // =====================================================
  useEffect(() => {
    if (!donnees.ville_depart || !donnees.ville_arrivee) {
      return;
    }

    if (donnees.ville_depart.length < 3 || donnees.ville_arrivee.length < 3) {
      return;
    }

    const timer = setTimeout(async () => {
      setChargementCarte(true);
      setErreurDistance("");

      try {
        const [coordDep, coordArr] = await Promise.all([
          geocoderVille(donnees.ville_depart),
          geocoderVille(donnees.ville_arrivee),
        ]);

        setCoordDepart(coordDep);
        setCoordArrivee(coordArr);
      } catch (err) {
        console.error("Erreur géocodage:", err);
      } finally {
        setChargementCarte(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [donnees.ville_depart, donnees.ville_arrivee]);

  // =====================================================
  // Callback quand OSRM calcule la distance
  // =====================================================
  const handleDistanceCalculee = useCallback(
    (distanceKm) => {
      const durees = calculerDureeEstimee(distanceKm);

      setDonnees((prev) => ({
        ...prev,
        distance_km: distanceKm,

        // La durée moyenne est automatiquement enregistrée.
        duree_estimee: durees.moyenne ? formaterDuree(durees.moyenne) : "",
      }));

      if (distanceKm < 40) {
        setErreurDistance(
          `Distance trop courte : ${distanceKm} km. Minimum requis : 40 km.`,
        );
      } else {
        setErreurDistance("");
      }
    },
    [calculerDureeEstimee, formaterDuree],
  );

  // =====================================================
  // Vérification du conflit trajet
  // =====================================================
  const verifierConflit = async () => {
    if (
      !donnees.date_depart ||
      !donnees.heure_depart ||
      !donnees.distance_km ||
      !donnees.vehicule
    ) {
      return;
    }

    setVerificationConflit(true);
    setConflitTrajet(null);

    try {
      const reponse = await api.post("/trajets/verifier-conflit/", {
        date_depart: donnees.date_depart,
        heure_depart: donnees.heure_depart + ":00",
        distance_km: donnees.distance_km,
        vehicule: donnees.vehicule,

        // Informations itinéraire
        ville_depart: donnees.ville_depart,
        ville_arrivee: donnees.ville_arrivee,

        // Coordonnées GPS
        lat_depart: coordDepart?.lat || null,
        lon_depart: coordDepart?.lon || null,
        lat_arrivee: coordArrivee?.lat || null,
        lon_arrivee: coordArrivee?.lon || null,
      });

      setConflitTrajet(reponse.data);
    } catch (err) {
      console.error(err);
    } finally {
      setVerificationConflit(false);
    }
  };

  // =====================================================
  // Modification d'un champ
  // =====================================================
  const modifierChamp = (e) => {
    const { name, value } = e.target;

    setDonnees((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Réinitialiser le conflit si un champ change
    setConflitTrajet(null);
  };

  // =====================================================
  // Date minimale
  // =====================================================
  const getDateMin = () => {
    const now = new Date();

    return now.toISOString().split("T")[0];
  };

  // =====================================================
  // Heure minimale
  // =====================================================
  const getHeureMin = () => {
    const now = new Date();

    now.setHours(now.getHours() + 2);

    return now.toTimeString().slice(0, 5);
  };

  // =====================================================
  // Étape suivante
  // =====================================================
  const suivant = async () => {
    setErreur("");

    if (etape === 1) {
      const depart = new Date(`${donnees.date_depart}T${donnees.heure_depart}`);

      const minimum = new Date();

      minimum.setHours(minimum.getHours() + 2);

      if (depart < minimum) {
        setErreur(
          "L'heure de départ doit être au minimum 2 heures après l'heure actuelle.",
        );

        return;
      }
    }

    // Vérification du conflit avant de passer à l'étape suivante
    if (
      etape === 2 &&
      donnees.vehicule &&
      donnees.date_depart &&
      donnees.heure_depart &&
      donnees.distance_km
    ) {
      await verifierConflit();
    }

    setEtape(etape + 1);
  };

  // =====================================================
  // Étape précédente
  // =====================================================
  const precedent = () => {
    setEtape(etape - 1);
  };

  // =====================================================
  // Ajouter un point d'arrêt
  // =====================================================
  const ajouterPoint = () => {
    if (!nouveauPoint.nom_lieu.trim()) {
      return;
    }

    setPointsArret([
      ...pointsArret,
      {
        ...nouveauPoint,
        ordre: pointsArret.length + 1,
      },
    ]);

    setNouveauPoint({
      type_point: "ramassage",
      nom_lieu: "",
    });
  };

  // =====================================================
  // Retirer un point d'arrêt
  // =====================================================
  const retirerPoint = (index) => {
    const restants = pointsArret.filter((_, i) => i !== index);

    setPointsArret(
      restants.map((p, i) => ({
        ...p,
        ordre: i + 1,
      })),
    );
  };

  // =====================================================
  // Soumettre / Publier le trajet
  // =====================================================
  const soumettre = async (e) => {
    e.preventDefault();

    setErreur("");

    const depart = new Date(`${donnees.date_depart}T${donnees.heure_depart}`);

    const minimum = new Date();

    minimum.setHours(minimum.getHours() + 2);

    if (depart < minimum) {
      setErreur(
        "L'heure de départ doit être au minimum 2 heures après l'heure actuelle.",
      );

      return;
    }

    // Vérification distance
    if (!donnees.distance_km || donnees.distance_km < 40) {
      setErreur("La distance du trajet doit être d'au moins 40 km.");

      return;
    }

    // Recalcul de la durée avant publication
    const durees = calculerDureeEstimee(donnees.distance_km);

    if (!durees.moyenne) {
      setErreur("Impossible de calculer la durée estimée du trajet.");

      return;
    }

    const dureeMoyenne = formaterDuree(durees.moyenne);

    // Mise à jour locale avant envoi
    setDonnees((prev) => ({
      ...prev,
      duree_estimee: dureeMoyenne,
    }));

    setEnvoi(true);

    try {
      // =================================================
      // 1. Publication du trajet principal
      // =================================================
      const reponse = await api.post("/trajets/publier/", {
        ville_depart: donnees.ville_depart,
        ville_arrivee: donnees.ville_arrivee,
        date_depart: donnees.date_depart,
        heure_depart: donnees.heure_depart,

        // Durée moyenne calculée automatiquement
        duree_estimee: dureeMoyenne,

        distance_km: donnees.distance_km,

        vehicule: donnees.vehicule,

        type_tarification: donnees.type_tarification,

        prix_unique: donnees.prix_unique,

        politique_bagages: donnees.politique_bagages || null,

        pauses_prevues: donnees.pauses_prevues || null,

        infos_complementaires: donnees.infos_complementaires || null,

        // =================================================
        // Coordonnées GPS
        // =================================================
        lat_depart: coordDepart?.lat || null,
        lon_depart: coordDepart?.lon || null,
        lat_arrivee: coordArrivee?.lat || null,
        lon_arrivee: coordArrivee?.lon || null,

        // =================================================
        // Plan des sièges
        // =================================================
        plan_sieges: JSON.stringify(
          sieges.map((s) => ({
            id: s.id,
            numero: s.numero,
            estChauffeur: s.estChauffeur,
            zone: s.zone,
            pos_x: Math.round(positions?.[s.id]?.x || 0),
            pos_y: Math.round(positions?.[s.id]?.y || 0),
          })),
        ),
      });

      const trajetId = reponse.data.trajet.id;

      // =================================================
      // 2. Envoi des points d'arrêt
      // =================================================
      for (const point of pointsArret) {
        await api.post(`/trajets/${trajetId}/points-arret/`, point);
      }

      // =================================================
      // 3. Redirection
      // =================================================
      navigate("/conducteur");
    } catch (err) {
      console.error(err);

      setErreur(
        err.response?.data
          ? JSON.stringify(err.response.data)
          : "Impossible de publier le trajet. Vérifiez les champs.",
      );
    } finally {
      setEnvoi(false);
    }
  };

  // =====================================================
  // Chargement des véhicules
  // =====================================================
  if (chargementVehicules) {
    return (
      <div>
        <Navbar />

        <div className="max-w-2xl mx-auto px-6 py-8">
          <Spinner />
        </div>
      </div>
    );
  }

  // =====================================================
  // Aucun véhicule
  // =====================================================
  if (vehicules.length === 0) {
    return (
      <div>
        <Navbar />

        <AlerteBlocage
          icone="🚗"
          titre="Véhicule requis"
          message="Vous devez d'abord enregistrer au moins un véhicule avant de pouvoir publier un trajet."
          lienAction={{
            to: "/conducteur/vehicules/ajouter",
            label: "Ajouter un véhicule",
          }}
        />
      </div>
    );
  }

  // =====================================================
  // Interface principale
  // =====================================================
  return (
    <div>
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Publier un trajet
        </h1>

        <p className="text-gray-500 mb-6">Étape {etape} sur 4</p>

        {/* =================================================
            Progression
        ================================================= */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className={`h-2 flex-1 rounded-full ${
                n <= etape ? "bg-blue-700" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        <div className="bg-white rounded-xl shadow p-8">
          {erreur && <MessageErreur message={erreur} />}

          {/* =====================================================
              ÉTAPE 1 — ITINÉRAIRE
          ===================================================== */}
          {etape === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-gray-800">
                  🗺️ Itinéraire
                </h2>

                {/* Villes */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ville de départ
                    </label>

                    <input
                      name="ville_depart"
                      value={donnees.ville_depart}
                      onChange={modifierChamp}
                      placeholder="Antananarivo"
                      className="w-full border rounded-lg px-4 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ville d'arrivée
                    </label>

                    <input
                      name="ville_arrivee"
                      value={donnees.ville_arrivee}
                      onChange={modifierChamp}
                      placeholder="Toamasina"
                      className="w-full border rounded-lg px-4 py-2"
                    />
                  </div>
                </div>

                {/* =================================================
                    Distance
                ================================================= */}
                {donnees.distance_km && (
                  <div
                    className={`rounded-lg border px-4 py-3 text-sm font-medium flex items-center gap-2 ${
                      donnees.distance_km >= 40
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-red-50 border-red-200 text-red-700"
                    }`}
                  >
                    {donnees.distance_km >= 40 ? "✅" : "❌"}

                    <span>
                      Distance calculée :{" "}
                      <strong>{donnees.distance_km} km</strong>
                    </span>

                    {donnees.distance_km < 40 && " — Minimum requis : 40 km"}
                  </div>
                )}

                {erreurDistance && (
                  <p className="text-red-600 text-sm">{erreurDistance}</p>
                )}

                {/* =================================================
                    Date et heure
                ================================================= */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date de départ
                    </label>

                    <input
                      type="date"
                      name="date_depart"
                      min={getDateMin()}
                      value={donnees.date_depart}
                      onChange={modifierChamp}
                      className="w-full border rounded-lg px-4 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Heure de départ
                    </label>

                    <input
                      type="time"
                      name="heure_depart"
                      value={donnees.heure_depart}
                      min={
                        donnees.date_depart === getDateMin()
                          ? getHeureMin()
                          : undefined
                      }
                      onChange={modifierChamp}
                      className="w-full border rounded-lg px-4 py-2"
                    />
                  </div>
                </div>

                {/* =================================================
                    DURÉE ESTIMÉE AUTOMATIQUE
                ================================================= */}
                {donnees.distance_km && donnees.distance_km >= 40 && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">⏱️</span>

                      <span className="font-semibold text-gray-800">
                        Durée prévue du trajet
                      </span>
                    </div>

                    {(() => {
                      const durees = calculerDureeEstimee(donnees.distance_km);

                      return (
                        <>
                          <p className="text-lg font-bold text-blue-700">
                            Entre {formaterDuree(durees.min)} et{" "}
                            {formaterDuree(durees.max)}
                          </p>

                          <p className="text-sm text-gray-700 mt-1">
                            Durée moyenne estimée : environ{" "}
                            <strong>{formaterDuree(durees.moyenne)}</strong>
                          </p>

                          <p className="text-xs text-gray-500 mt-2">
                            Cette estimation est calculée automatiquement selon
                            la distance du trajet, avec une vitesse estimée
                            comprise entre {VITESSE_MIN} et {VITESSE_MAX} km/h.
                          </p>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* =================================================
                    Suivant
                ================================================= */}
                <div className="pt-4 flex justify-end">
                  <button
                    onClick={suivant}
                    disabled={
                      !donnees.ville_depart ||
                      !donnees.ville_arrivee ||
                      !donnees.date_depart ||
                      !donnees.heure_depart ||
                      !donnees.distance_km ||
                      donnees.distance_km < 40
                    }
                    className="bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-50"
                  >
                    Suivant →
                  </button>
                </div>
              </div>

              {/* =================================================
                  Carte
              ================================================= */}
              <div className="sticky top-24 h-[calc(100vh-170px)]">
                {chargementCarte ? (
                  <div className="h-full rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center">
                    <span className="text-gray-500">
                      Chargement de la carte...
                    </span>
                  </div>
                ) : coordDepart && coordArrivee ? (
                  <div className="h-full rounded-xl overflow-hidden shadow-lg">
                    <CarteItineraire
                      coordDepart={coordDepart}
                      coordArrivee={coordArrivee}
                      villeDepart={donnees.ville_depart}
                      villeArrivee={donnees.ville_arrivee}
                      onDistanceCalculee={handleDistanceCalculee}
                    />
                  </div>
                ) : (
                  <div className="h-full rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🗺️</div>

                      <p className="font-semibold text-gray-700">
                        La carte apparaîtra ici
                      </p>

                      <p className="text-sm text-gray-500 mt-2">
                        Entrez la ville de départ et la ville d'arrivée.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =====================================================
              ÉTAPE 2 — VÉHICULE + VÉRIFICATION CONFLIT
          ===================================================== */}
          {etape === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                🚐 Choisir un véhicule
              </h2>

              <div className="space-y-2">
                {vehicules.map((v) => (
                  <label
                    key={v.id}
                    onClick={() => {
                      const nbPlaces = v.nombre_places;

                      const nouveauxSieges = [
                        {
                          id: "chauffeur",
                          numero: 0,
                          actif: true,
                          estChauffeur: true,
                          zone: "reserve",
                        },

                        ...Array.from({ length: nbPlaces }, (_, i) => ({
                          id: `siege-${i + 1}`,
                          numero: i + 1,
                          actif: true,
                          estChauffeur: false,
                          zone: "reserve",
                        })),
                      ];

                      setDonnees((prev) => ({
                        ...prev,
                        vehicule: String(v.id),
                      }));

                      setConflitTrajet(null);

                      setSieges(nouveauxSieges);
                    }}
                    className={`block border rounded-lg px-4 py-3 cursor-pointer ${
                      donnees.vehicule === String(v.id)
                        ? "border-blue-700 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="vehicule"
                      value={v.id}
                      checked={donnees.vehicule === String(v.id)}
                      onChange={() => {}}
                      className="mr-2"
                    />
                    {v.marque} {v.modele} — {v.immatriculation} (
                    {v.nombre_places} places)
                  </label>
                ))}
              </div>

              {/* Plan des sièges */}
              {donnees.vehicule && sieges.length > 0 && (
                <PlanSieges
                  sieges={sieges}
                  setSieges={setSieges}
                  positions={positions}
                  setPositions={setPositions}
                />
              )}

              {/* =================================================
                  VÉRIFICATION CONFLIT
              ================================================= */}
              {donnees.vehicule &&
                donnees.date_depart &&
                donnees.heure_depart &&
                donnees.distance_km && (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={verifierConflit}
                      disabled={verificationConflit}
                      className="bg-gray-800 text-white px-5 py-2 rounded-lg font-semibold hover:bg-gray-900 disabled:opacity-50"
                    >
                      {verificationConflit
                        ? "Vérification..."
                        : "Vérifier les conflits"}
                    </button>

                    {conflitTrajet && (
                      <div
                        className={`mt-3 px-4 py-3 rounded-lg text-sm font-medium ${
                          conflitTrajet.compatible
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {conflitTrajet.message}
                      </div>
                    )}
                  </div>
                )}

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                <button
                  onClick={precedent}
                  className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-200"
                >
                  ← Précédent
                </button>

                <button
                  onClick={suivant}
                  disabled={
                    !donnees.vehicule ||
                    sieges.filter((s) => !s.estChauffeur && s.zone === "plan")
                      .length === 0 ||
                    verificationConflit ||
                    conflitTrajet?.compatible === false
                  }
                  className="bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-50"
                >
                  Suivant →
                </button>
              </div>
            </div>
          )}

          {/* =====================================================
              ÉTAPE 3 — TARIFICATION
          ===================================================== */}
          {etape === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                💰 Tarification
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de tarification
                </label>

                <select
                  name="type_tarification"
                  value={donnees.type_tarification}
                  onChange={modifierChamp}
                  className="w-full border rounded-lg px-4 py-2"
                >
                  <option value="unique">Tarif unique</option>

                  <option value="par_destination">Tarif par destination</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prix (Ar)
                </label>

                <input
                  type="number"
                  name="prix_unique"
                  value={donnees.prix_unique}
                  onChange={modifierChamp}
                  className="w-full border rounded-lg px-4 py-2"
                  placeholder="25000"
                />
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={precedent}
                  className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-200"
                >
                  ← Précédent
                </button>

                <button
                  onClick={suivant}
                  className="bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-800"
                >
                  Suivant →
                </button>
              </div>
            </div>
          )}

          {/* =====================================================
              ÉTAPE 4 — POINTS D'ARRÊT + INFOS + ENVOI
          ===================================================== */}
          {etape === 4 && (
            <form onSubmit={soumettre} className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                📍 Points d'arrêt (facultatif)
              </h2>

              {/* Ajouter un point d'arrêt */}
              <div className="flex gap-2">
                <select
                  value={nouveauPoint.type_point}
                  onChange={(e) =>
                    setNouveauPoint({
                      ...nouveauPoint,
                      type_point: e.target.value,
                    })
                  }
                  className="border rounded-lg px-3 py-2"
                >
                  <option value="ramassage">Ramassage</option>

                  <option value="depose">Dépose</option>
                </select>

                <input
                  value={nouveauPoint.nom_lieu}
                  onChange={(e) =>
                    setNouveauPoint({
                      ...nouveauPoint,
                      nom_lieu: e.target.value,
                    })
                  }
                  className="flex-1 border rounded-lg px-4 py-2"
                  placeholder="Nom du lieu"
                />

                <button
                  type="button"
                  onClick={ajouterPoint}
                  className="bg-gray-800 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  + Ajouter
                </button>
              </div>

              {/* Liste des points d'arrêt */}
              {pointsArret.length > 0 && (
                <ul className="space-y-2">
                  {pointsArret.map((p, i) => (
                    <li
                      key={i}
                      className="flex justify-between items-center border rounded-lg px-4 py-2"
                    >
                      <span>
                        {i + 1}.{" "}
                        {p.type_point === "ramassage"
                          ? "🔵 Ramassage"
                          : "🔴 Dépose"}{" "}
                        — {p.nom_lieu}
                      </span>

                      <button
                        type="button"
                        onClick={() => retirerPoint(i)}
                        className="text-red-600 text-sm"
                      >
                        Retirer
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Informations complémentaires */}
              <h2 className="text-xl font-bold text-gray-800 mb-2 pt-4">
                📝 Infos complémentaires
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Politique bagages (facultatif)
                </label>

                <textarea
                  name="politique_bagages"
                  value={donnees.politique_bagages}
                  onChange={modifierChamp}
                  className="w-full border rounded-lg px-4 py-2"
                  rows="2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pauses prévues (facultatif)
                </label>

                <textarea
                  name="pauses_prevues"
                  value={donnees.pauses_prevues}
                  onChange={modifierChamp}
                  className="w-full border rounded-lg px-4 py-2"
                  rows="2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Infos complémentaires (facultatif)
                </label>

                <textarea
                  name="infos_complementaires"
                  value={donnees.infos_complementaires}
                  onChange={modifierChamp}
                  className="w-full border rounded-lg px-4 py-2"
                  rows="2"
                />
              </div>

              {/* Navigation / Publication */}
              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={precedent}
                  className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-200"
                >
                  ← Précédent
                </button>

                <button
                  type="submit"
                  disabled={envoi}
                  className="bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-50"
                >
                  {envoi ? "Publication..." : "Publier le trajet"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
