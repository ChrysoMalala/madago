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
  // DONNÉES TRAJET
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
  // CONFLIT TRAJET
  // =====================================================

  const [conflitTrajet, setConflitTrajet] = useState(null);
  const [verificationConflit, setVerificationConflit] = useState(false);

  // =====================================================
  // POINTS D'ARRÊT
  // =====================================================

  const [pointsArret, setPointsArret] = useState([]);

  const [nouveauPoint, setNouveauPoint] = useState({
    type_point: "ramassage",
    nom_lieu: "",
  });

  // =====================================================
  // PLAN DES SIÈGES
  // =====================================================

  const [sieges, setSieges] = useState([]);
  const [positions, setPositions] = useState({});

  // =====================================================
  // COORDONNÉES
  // =====================================================

  const [coordDepart, setCoordDepart] = useState(null);
  const [coordArrivee, setCoordArrivee] = useState(null);

  const [chargementCarte, setChargementCarte] = useState(false);
  const [erreurDistance, setErreurDistance] = useState("");

  // =====================================================
  // CONSTANTES
  // =====================================================

  const VITESSE_MIN = 30;
  const VITESSE_MOYENNE = 55;
  const VITESSE_MAX = 80;

  // =====================================================
  // DATE MINIMUM
  // =====================================================

  const getDateMin = () => {
    const maintenant = new Date();
    return maintenant.toISOString().split("T")[0];
  };

  // =====================================================
  // CHARGEMENT DES VÉHICULES
  // =====================================================

  useEffect(() => {
    let actif = true;

    const chargerVehicules = async () => {
      setChargementVehicules(true);
      setErreur("");

      try {
        const response = await api.get("/vehicules/");

        if (!actif) return;

        const data = response?.data;

        if (Array.isArray(data)) {
          setVehicules(data);
        } else if (Array.isArray(data?.results)) {
          setVehicules(data.results);
        } else if (Array.isArray(data?.vehicules)) {
          setVehicules(data.vehicules);
        } else {
          setVehicules([]);
        }
      } catch (error) {
        if (!actif) return;

        setErreur(
          error?.response?.data?.detail ||
            "Impossible de charger vos véhicules.",
        );
      } finally {
        if (actif) {
          setChargementVehicules(false);
        }
      }
    };

    chargerVehicules();

    return () => {
      actif = false;
    };
  }, []);

  // =====================================================
  // GÉOCODAGE
  // =====================================================

  const geocoder = useCallback(async (ville) => {
    const nom = String(ville || "").trim();

    if (!nom) return null;

    const url =
      "https://nominatim.openstreetmap.org/search" +
      `?format=jsonv2&limit=1&countrycodes=mg&accept-language=fr&q=${encodeURIComponent(
        `${nom}, Madagascar`,
      )}`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Erreur pendant la recherche de localisation.");
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    return {
      lat: Number(data[0].lat),
      lon: Number(data[0].lon),
      latitude: Number(data[0].lat),
      longitude: Number(data[0].lon),
      display_name: data[0].display_name,
    };
  }, []);

  // =====================================================
  // CALCUL ITINÉRAIRE
  // =====================================================

  const calculerItineraire = useCallback(async (depart, arrivee) => {
    if (!depart || !arrivee) return null;

    const url =
      "https://router.project-osrm.org/route/v1/driving/" +
      `${depart.lon},${depart.lat};${arrivee.lon},${arrivee.lat}` +
      "?overview=false";

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Impossible de calculer l'itinéraire.");
    }

    const data = await response.json();

    if (
      data?.code !== "Ok" ||
      !Array.isArray(data?.routes) ||
      !data.routes[0]
    ) {
      return null;
    }

    const route = data.routes[0];

    return {
      distance_km: Number((route.distance / 1000).toFixed(1)),
      duration_minutes: Math.round(route.duration / 60),
    };
  }, []);

  // =====================================================
  // MISE À JOUR ITINÉRAIRE
  // =====================================================

  const mettreAJourItineraire = useCallback(async () => {
    const villeDepart = donnees.ville_depart.trim();
    const villeArrivee = donnees.ville_arrivee.trim();

    if (!villeDepart || !villeArrivee) return;

    setChargementCarte(true);
    setErreurDistance("");

    try {
      const [depart, arrivee] = await Promise.all([
        geocoder(villeDepart),
        geocoder(villeArrivee),
      ]);

      if (!depart) {
        setErreurDistance(
          "Ville de départ introuvable. Vérifiez le nom saisi.",
        );
        setCoordDepart(null);
        return;
      }

      if (!arrivee) {
        setErreurDistance("Destination introuvable. Vérifiez le nom saisi.");
        setCoordArrivee(null);
        return;
      }

      setCoordDepart(depart);
      setCoordArrivee(arrivee);

      const itineraire = await calculerItineraire(depart, arrivee);

      if (!itineraire) {
        setErreurDistance(
          "Impossible de calculer la distance de cet itinéraire.",
        );
        return;
      }

      setDonnees((ancienne) => ({
        ...ancienne,
        distance_km: itineraire.distance_km,
        duree_estimee:
          itineraire.duration_minutes > 0
            ? `${Math.floor(itineraire.duration_minutes / 60)}h ${String(
                itineraire.duration_minutes % 60,
              ).padStart(2, "0")}min`
            : ancienne.duree_estimee,
      }));

      if (itineraire.distance_km < 40) {
        setErreurDistance("La distance du trajet doit être d'au moins 40 km.");
      } else {
        setErreurDistance("");
      }

      return itineraire;
    } catch (error) {
      setErreurDistance(
        error?.message ||
          "Une erreur est survenue pendant le calcul de l'itinéraire.",
      );

      return null;
    } finally {
      setChargementCarte(false);
    }
  }, [
    donnees.ville_depart,
    donnees.ville_arrivee,
    geocoder,
    calculerItineraire,
  ]);

  // =====================================================
  // DISTANCE DEPUIS LA CARTE
  // =====================================================

  const handleDistanceCalculee = useCallback((distance) => {
    const valeur = Number(distance);

    if (!Number.isFinite(valeur)) return;

    const distanceArrondie = Number(valeur.toFixed(1));

    setDonnees((ancienne) => ({
      ...ancienne,
      distance_km: distanceArrondie,
    }));

    if (distanceArrondie < 40) {
      setErreurDistance("La distance du trajet doit être d'au moins 40 km.");
    } else {
      setErreurDistance("");
    }
  }, []);

  // =====================================================
  // VALIDATION ÉTAPE 1
  // =====================================================

  const validerEtape1 = async () => {
    setErreur("");
    setErreurDistance("");

    if (!donnees.ville_depart.trim()) {
      setErreur("Veuillez indiquer la ville de départ.");
      return false;
    }

    if (!donnees.ville_arrivee.trim()) {
      setErreur("Veuillez indiquer la destination.");
      return false;
    }

    if (
      donnees.ville_depart.trim().toLowerCase() ===
      donnees.ville_arrivee.trim().toLowerCase()
    ) {
      setErreur(
        "La ville de départ et la destination doivent être différentes.",
      );
      return false;
    }

    if (!donnees.date_depart) {
      setErreur("Veuillez sélectionner la date du trajet.");
      return false;
    }

    if (!donnees.heure_depart) {
      setErreur("Veuillez sélectionner l'heure de départ.");
      return false;
    }

    const depart = new Date(
      `${donnees.date_depart}T${donnees.heure_depart}:00`,
    );

    if (Number.isNaN(depart.getTime())) {
      setErreur("La date ou l'heure du trajet est invalide.");
      return false;
    }

    const maintenant = new Date();

    const minimum = new Date(maintenant.getTime() + 2 * 60 * 60 * 1000);

    if (depart < minimum) {
      setErreur("Le départ doit être prévu au moins 2 heures à l'avance.");
      return false;
    }

    if (!coordDepart || !coordArrivee || !donnees.distance_km) {
      const resultat = await mettreAJourItineraire();

      if (!resultat && !donnees.distance_km) {
        return false;
      }
    }

    return true;
  };

  const continuerEtape1 = async () => {
    const valide = await validerEtape1();

    if (!valide) return;

    if (!donnees.distance_km || donnees.distance_km < 40) {
      setErreur("Le trajet doit avoir une distance d'au moins 40 km.");
      return;
    }

    setEtape(2);
  };

  // =====================================================
  // VÉRIFICATION CONFLIT
  // =====================================================

  const verifierConflit = async () => {
    if (!donnees.vehicule) {
      setErreur("Veuillez sélectionner un véhicule.");
      return false;
    }

    setVerificationConflit(true);
    setConflitTrajet(null);
    setErreur("");

    try {
      const response = await api.post("/trajets/verifier-conflit/", {
        date_depart: donnees.date_depart,
        heure_depart: `${donnees.heure_depart}:00`,
        distance_km: donnees.distance_km,
        vehicule: donnees.vehicule,
      });

      const data = response?.data;

      if (
        data?.conflit === true ||
        data?.has_conflict === true ||
        data?.bloque === true ||
        data?.compatible === false
      ) {
        setConflitTrajet(data);
        return false;
      }

      return true;
    } catch (error) {
      const status = error?.response?.status;
      const data = error?.response?.data;

      if (
        status === 409 ||
        data?.conflit === true ||
        data?.compatible === false
      ) {
        setConflitTrajet(
          data || {
            conflit: true,
            detail:
              "Ce véhicule ou ce conducteur est déjà engagé sur un trajet incompatible.",
          },
        );

        return false;
      }

      setErreur(
        data?.detail || "Impossible de vérifier la disponibilité du trajet.",
      );

      return false;
    } finally {
      setVerificationConflit(false);
    }
  };

  // =====================================================
  // VALIDATION ÉTAPE 2
  // =====================================================

  const continuerEtape2 = async () => {
    setErreur("");

    if (!donnees.vehicule) {
      setErreur("Veuillez sélectionner un véhicule.");
      return;
    }

    if (!sieges || sieges.length === 0) {
      setErreur("Veuillez organiser le plan des sièges avant de continuer.");
      return;
    }

    const placesReservables = sieges.filter(
      (siege) => !siege.estChauffeur && siege.zone === "plan",
    );

    if (placesReservables.length === 0) {
      setErreur("Placez au moins un siège passager dans le plan du véhicule.");
      return;
    }

    const libre = await verifierConflit();

    if (!libre) return;

    setEtape(3);
  };

  // =====================================================
  // VALIDATION ÉTAPE 3
  // =====================================================

  const continuerEtape3 = () => {
    setErreur("");

    if (!donnees.prix_unique || Number(donnees.prix_unique) <= 0) {
      setErreur("Veuillez indiquer un prix par place valide.");
      return;
    }

    setEtape(4);
  };

  // =====================================================
  // AJOUTER POINT D'ARRÊT
  // =====================================================

  const ajouterPoint = () => {
    if (!nouveauPoint.nom_lieu.trim()) return;

    setPointsArret((anciens) => [
      ...anciens,
      {
        ...nouveauPoint,
        nom_lieu: nouveauPoint.nom_lieu.trim(),
        ordre: anciens.length + 1,
      },
    ]);

    setNouveauPoint({
      type_point: "ramassage",
      nom_lieu: "",
    });
  };

  // =====================================================
  // SUPPRIMER POINT D'ARRÊT
  // =====================================================

  const retirerPoint = (index) => {
    setPointsArret((anciens) =>
      anciens
        .filter((_, i) => i !== index)
        .map((point, i) => ({
          ...point,
          ordre: i + 1,
        })),
    );
  };

  // =====================================================
  // SÉLECTION DU VÉHICULE
  // =====================================================

  const selectionnerVehicule = (vehicule) => {
    setDonnees((ancienne) => ({
      ...ancienne,
      vehicule: String(vehicule.id),
    }));

    setConflitTrajet(null);

    const nombrePlaces = Number(vehicule.nombre_places) || 5;

    const nouveauxSieges = [
      {
        id: "chauffeur",
        numero: "chauffeur",
        estChauffeur: true,
        zone: "plan",
      },

      ...Array.from({ length: nombrePlaces }, (_, index) => ({
        id: `siege-${index + 1}`,
        numero: index + 1,
        estChauffeur: false,
        zone: "reserve",
      })),
    ];

    setSieges(nouveauxSieges);

    const positionsInitiales = {
      chauffeur: {
        x: 40,
        y: 60,
      },
    };

    nouveauxSieges.forEach((siege, index) => {
      if (!siege.estChauffeur) {
        positionsInitiales[siege.id] = {
          x: 20 + (index % 3) * 25,
          y: 20 + Math.floor(index / 3) * 30,
        };
      }
    });

    setPositions(positionsInitiales);
  };

  // =====================================================
  // PUBLICATION
  // =====================================================

  const publierTrajet = async () => {
    setErreur("");
    setEnvoi(true);

    try {
      if (!donnees.vehicule) {
        throw new Error("Veuillez sélectionner un véhicule.");
      }

      if (!donnees.distance_km || donnees.distance_km < 40) {
        throw new Error("La distance du trajet doit être d'au moins 40 km.");
      }

      const placesReservables = sieges.filter(
        (siege) => !siege.estChauffeur && siege.zone === "plan",
      );

      if (placesReservables.length === 0) {
        throw new Error(
          "Placez au moins un siège passager dans le plan du véhicule.",
        );
      }

      let departFinal = coordDepart;
      let arriveeFinale = coordArrivee;

      if (!departFinal || !arriveeFinale) {
        const [depart, arrivee] = await Promise.all([
          geocoder(donnees.ville_depart),
          geocoder(donnees.ville_arrivee),
        ]);

        departFinal = depart;
        arriveeFinale = arrivee;

        setCoordDepart(depart);
        setCoordArrivee(arrivee);
      }

      const payload = {
        ville_depart: donnees.ville_depart,
        ville_arrivee: donnees.ville_arrivee,
        date_depart: donnees.date_depart,
        heure_depart: donnees.heure_depart,

        duree_estimee: donnees.duree_estimee,
        distance_km: donnees.distance_km,

        vehicule: donnees.vehicule,

        type_tarification: donnees.type_tarification,

        prix_unique: donnees.prix_unique,

        politique_bagages: donnees.politique_bagages || null,

        pauses_prevues: donnees.pauses_prevues || null,

        infos_complementaires: donnees.infos_complementaires || null,

        // Coordonnées GPS
        coord_depart: departFinal
          ? {
              lat: departFinal.lat,
              lon: departFinal.lon,
              latitude: departFinal.latitude,
              longitude: departFinal.longitude,
            }
          : null,

        coord_arrivee: arriveeFinale
          ? {
              lat: arriveeFinale.lat,
              lon: arriveeFinale.lon,
              latitude: arriveeFinale.latitude,
              longitude: arriveeFinale.longitude,
            }
          : null,

        // Plan des sièges
        sieges: sieges.map((siege) => ({
          id: siege.id,
          numero: siege.numero,
          estChauffeur: siege.estChauffeur,
          zone: siege.zone,

          position: positions[siege.id] || {
            x: 0,
            y: 0,
          },
        })),
      };

      const response = await api.post("/trajets/publier/", payload);

      const trajetId = response?.data?.trajet?.id || response?.data?.id;

      // -----------------------------------------------------
      // POINTS D'ARRÊT
      // Même comportement que l'ancien code
      // -----------------------------------------------------

      if (trajetId && pointsArret.length > 0) {
        for (const point of pointsArret) {
          await api.post(`/trajets/${trajetId}/points-arret/`, {
            type_point:
              point.type_point === "depot" ? "depose" : point.type_point,

            nom_lieu: point.nom_lieu,
            ordre: point.ordre,
          });
        }
      }

      navigate("/conducteur/trajets");
    } catch (error) {
      console.error("Erreur publication trajet :", error);

      const data = error?.response?.data;

      if (typeof data === "string") {
        setErreur(data);
      } else if (data?.detail) {
        setErreur(data.detail);
      } else if (data?.message) {
        setErreur(data.message);
      } else if (data && typeof data === "object") {
        const messages = Object.entries(data)
          .map(([champ, valeur]) => {
            if (Array.isArray(valeur)) {
              return `${champ}: ${valeur.join(", ")}`;
            }

            return `${champ}: ${String(valeur)}`;
          })
          .join(" | ");

        setErreur(
          messages ||
            "Une erreur est survenue pendant la publication du trajet.",
        );
      } else {
        setErreur(
          error?.message ||
            "Une erreur est survenue pendant la publication du trajet.",
        );
      }
    } finally {
      setEnvoi(false);
    }
  };

  // =====================================================
  // CHARGEMENT INITIAL
  // =====================================================

  if (chargementVehicules) {
    return (
      <div className="min-h-screen bg-[#F7F9F8]">
        <Navbar />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-10">
            <div className="min-h-[300px] flex flex-col items-center justify-center">
              <Spinner />

              <p className="mt-4 text-sm text-gray-500">
                Chargement de vos véhicules...
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // =====================================================
  // AUCUN VÉHICULE
  // =====================================================

  if (vehicules.length === 0) {
    return (
      <div className="min-h-screen bg-[#F7F9F8]">
        <Navbar />

        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {erreur && (
            <div className="mb-6">
              <MessageErreur message={erreur} />
            </div>
          )}

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#062A25]">
              Publier un trajet
            </h1>

            <p className="mt-2 text-gray-500">
              Avant de publier votre premier trajet, enregistrez le véhicule que
              vous allez utiliser.
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl shadow-lg overflow-hidden">
            <div className="h-2 bg-[#23C483]" />

            <div className="p-8 sm:p-10 text-center">
              <div className="mx-auto w-20 h-20 rounded-3xl bg-[#EAF9F3] flex items-center justify-center text-4xl">
                🚗
              </div>

              <h2 className="mt-6 text-2xl font-bold text-[#062A25]">
                Véhicule requis
              </h2>

              <p className="mt-3 max-w-lg mx-auto text-gray-500 leading-6">
                Vous devez enregistrer au moins un véhicule avant de pouvoir
                publier un trajet sur MadaGo.
              </p>

              <div className="mt-7 max-w-lg mx-auto bg-[#F7F9F8] rounded-2xl p-5 text-left">
                <p className="text-sm font-semibold text-[#062A25] mb-3">
                  Préparez les informations suivantes :
                </p>

                <div className="space-y-2 text-sm text-gray-600">
                  <p>✓ Marque et modèle</p>
                  <p>✓ Immatriculation</p>
                  <p>✓ Nombre de places</p>
                  <p>✓ Informations du véhicule</p>
                  <p>✓ Photos du véhicule</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/conducteur/vehicules/ajouter")}
                className="
                  mt-8
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  bg-[#23C483]
                  text-[#062A25]
                  px-8
                  py-3.5
                  rounded-xl
                  font-bold
                  hover:bg-[#1fb173]
                  transition
                  shadow-sm
                "
              >
                <span className="text-lg">+</span>
                Ajouter mon véhicule
              </button>

              <p className="mt-4 text-xs text-gray-400">
                Vous pourrez ensuite revenir à la publication de votre trajet.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // =====================================================
  // INTERFACE PRINCIPALE
  // =====================================================

  return (
    <div className="min-h-screen bg-[#F7F9F8]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 space-y-6">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="bg-[#062A25] rounded-3xl overflow-hidden shadow-lg">
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl">
              🚗
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-[#23C483] text-[#062A25] text-xs font-bold px-3 py-1 rounded-full">
                  CONDUCTEUR
                </span>

                <span className="text-white/60 text-xs">
                  Étape {etape} sur 4
                </span>
              </div>

              <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-white">
                Publier un trajet
              </h1>

              <p className="mt-2 text-sm sm:text-base text-white/70">
                Créez votre trajet et proposez vos places aux passagers MadaGo.
              </p>
            </div>
          </div>
        </div>

        {/* =================================================
            PROGRESSION
        ================================================= */}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
          <div className="grid grid-cols-4 gap-2 sm:gap-4">
            {[
              {
                numero: 1,
                titre: "Itinéraire",
                icone: "📍",
              },
              {
                numero: 2,
                titre: "Véhicule",
                icone: "🚗",
              },
              {
                numero: 3,
                titre: "Tarification",
                icone: "💰",
              },
              {
                numero: 4,
                titre: "Confirmation",
                icone: "✓",
              },
            ].map((item) => {
              const actif = item.numero === etape;

              const termine = item.numero < etape;

              return (
                <div
                  key={item.numero}
                  className="flex flex-col items-center text-center"
                >
                  <div
                    className={`
                      w-9 h-9 sm:w-11 sm:h-11
                      rounded-full
                      flex
                      items-center
                      justify-center
                      text-sm
                      font-bold
                      transition
                      ${
                        actif
                          ? "bg-[#062A25] text-white ring-4 ring-[#23C483]/20"
                          : termine
                            ? "bg-[#23C483] text-[#062A25]"
                            : "bg-gray-100 text-gray-400"
                      }
                    `}
                  >
                    {termine ? "✓" : item.numero}
                  </div>

                  <span
                    className={`
                      mt-2
                      text-[10px]
                      sm:text-xs
                      font-medium
                      ${actif ? "text-[#062A25]" : "text-gray-400"}
                    `}
                  >
                    <span className="hidden sm:inline">{item.icone} </span>

                    {item.titre}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#23C483] rounded-full transition-all duration-300"
              style={{
                width: `${(etape / 4) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* =================================================
            ERREUR
        ================================================= */}

        {erreur && <MessageErreur message={erreur} />}

        {/* =================================================
            CONFLIT
        ================================================= */}

        {conflitTrajet && (
          <AlerteBlocage
            message={
              conflitTrajet?.detail ||
              conflitTrajet?.message ||
              "Ce trajet est incompatible avec un autre trajet existant."
            }
          />
        )}

        {/* =================================================
            CONTENU
        ================================================= */}

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 sm:p-8">
          {/* =================================================
              ÉTAPE 1
          ================================================= */}

          {etape === 1 && (
            <div className="space-y-7">
              <div>
                <span className="text-xs font-bold text-[#23C483] uppercase tracking-wider">
                  Étape 1
                </span>

                <h2 className="mt-2 text-2xl font-bold text-[#062A25]">
                  Votre itinéraire
                </h2>

                <p className="mt-2 text-gray-500">
                  Indiquez le départ, la destination et la date de votre trajet.
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-7">
                {/* COLONNE FORMULAIRE */}

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Ville de départ
                    </label>

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2">
                        📍
                      </span>

                      <input
                        type="text"
                        value={donnees.ville_depart}
                        onChange={(e) => {
                          setDonnees({
                            ...donnees,
                            ville_depart: e.target.value,
                            distance_km: null,
                          });

                          setCoordDepart(null);
                        }}
                        onBlur={mettreAJourItineraire}
                        placeholder="Ex : Antananarivo"
                        className="
                          w-full
                          border
                          border-gray-200
                          rounded-xl
                          pl-11
                          pr-4
                          py-3.5
                          focus:ring-2
                          focus:ring-[#23C483]
                          focus:border-transparent
                          outline-none
                          transition
                        "
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Destination
                    </label>

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2">
                        🚩
                      </span>

                      <input
                        type="text"
                        value={donnees.ville_arrivee}
                        onChange={(e) => {
                          setDonnees({
                            ...donnees,
                            ville_arrivee: e.target.value,
                            distance_km: null,
                          });

                          setCoordArrivee(null);
                        }}
                        onBlur={mettreAJourItineraire}
                        placeholder="Ex : Toamasina"
                        className="
                          w-full
                          border
                          border-gray-200
                          rounded-xl
                          pl-11
                          pr-4
                          py-3.5
                          focus:ring-2
                          focus:ring-[#23C483]
                          focus:border-transparent
                          outline-none
                          transition
                        "
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Date du trajet
                      </label>

                      <input
                        type="date"
                        min={getDateMin()}
                        value={donnees.date_depart}
                        onChange={(e) =>
                          setDonnees({
                            ...donnees,
                            date_depart: e.target.value,
                          })
                        }
                        className="
                          w-full
                          border
                          border-gray-200
                          rounded-xl
                          px-4
                          py-3.5
                          focus:ring-2
                          focus:ring-[#23C483]
                          outline-none
                        "
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Heure de départ
                      </label>

                      <input
                        type="time"
                        value={donnees.heure_depart}
                        onChange={(e) =>
                          setDonnees({
                            ...donnees,
                            heure_depart: e.target.value,
                          })
                        }
                        className="
                          w-full
                          border
                          border-gray-200
                          rounded-xl
                          px-4
                          py-3.5
                          focus:ring-2
                          focus:ring-[#23C483]
                          outline-none
                        "
                      />
                    </div>
                  </div>

                  {chargementCarte && (
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4 text-sm text-gray-500">
                      <Spinner />
                      Calcul de l'itinéraire...
                    </div>
                  )}

                  {donnees.distance_km && (
                    <div
                      className={`
                        rounded-2xl
                        border
                        p-5
                        ${
                          donnees.distance_km >= 40
                            ? "bg-[#F0FBF7] border-[#23C483]/30"
                            : "bg-red-50 border-red-200"
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          🛣️
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">
                            Distance estimée
                          </p>

                          <p className="text-lg font-bold text-[#062A25]">
                            {donnees.distance_km} km
                          </p>
                        </div>
                      </div>

                      {donnees.duree_estimee && (
                        <p className="mt-3 text-sm text-gray-600">
                          ⏱ Durée estimée :{" "}
                          <strong>{donnees.duree_estimee}</strong>
                        </p>
                      )}

                      <p className="mt-2 text-xs text-gray-400">
                        Vitesse de référence : {VITESSE_MIN}–{VITESSE_MAX} km/h
                        (moyenne {VITESSE_MOYENNE} km/h).
                      </p>
                    </div>
                  )}

                  {erreurDistance && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
                      ⚠️ {erreurDistance}
                    </div>
                  )}
                </div>

                {/* CARTE */}

                <div className="min-h-[360px]">
                  {coordDepart && coordArrivee ? (
                    <div className="h-full min-h-[360px] rounded-2xl overflow-hidden border border-gray-100">
                      <CarteItineraire
                        coordDepart={coordDepart}
                        coordArrivee={coordArrivee}
                        villeDepart={donnees.ville_depart}
                        villeArrivee={donnees.ville_arrivee}
                        onDistanceCalculee={handleDistanceCalculee}
                      />
                    </div>
                  ) : (
                    <div className="h-full min-h-[360px] rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-center p-8">
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-3xl">
                        🗺️
                      </div>

                      <p className="mt-4 font-semibold text-[#062A25]">
                        Votre itinéraire
                      </p>

                      <p className="mt-2 text-sm text-gray-400 max-w-xs">
                        Entrez la ville de départ et votre destination pour
                        afficher le trajet sur la carte.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={continuerEtape1}
                  disabled={chargementCarte}
                  className="
                    bg-[#062A25]
                    text-white
                    px-7
                    py-3
                    rounded-xl
                    font-semibold
                    hover:bg-[#041D19]
                    transition
                    disabled:opacity-50
                  "
                >
                  Continuer →
                </button>
              </div>
            </div>
          )}

          {/* =================================================
              ÉTAPE 2
          ================================================= */}

          {etape === 2 && (
            <div className="space-y-8">
              <div>
                <span className="text-xs font-bold text-[#23C483] uppercase tracking-wider">
                  Étape 2
                </span>

                <h2 className="mt-2 text-2xl font-bold text-[#062A25]">
                  Véhicule et places
                </h2>

                <p className="mt-2 text-gray-500">
                  Choisissez votre véhicule puis organisez les places proposées
                  aux passagers.
                </p>
              </div>

              {/* VÉHICULES */}

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#062A25]">
                    Choisir le véhicule
                  </h3>

                  <button
                    type="button"
                    onClick={() => navigate("/conducteur/vehicules/ajouter")}
                    className="text-sm font-semibold text-[#062A25] hover:text-[#23C483] transition"
                  >
                    + Ajouter un véhicule
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {vehicules.map((vehicule) => {
                    const selectionne =
                      String(donnees.vehicule) === String(vehicule.id);

                    return (
                      <button
                        type="button"
                        key={vehicule.id}
                        onClick={() => selectionnerVehicule(vehicule)}
                        className={`
                            relative
                            text-left
                            rounded-2xl
                            border-2
                            p-5
                            transition-all
                            ${
                              selectionne
                                ? "border-[#23C483] bg-[#F0FBF7] shadow-md"
                                : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                            }
                          `}
                      >
                        {selectionne && (
                          <div className="absolute top-4 right-4 w-7 h-7 bg-[#23C483] rounded-full flex items-center justify-center text-[#062A25] font-bold">
                            ✓
                          </div>
                        )}

                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl">
                            🚘
                          </div>

                          <div>
                            <h4 className="font-bold text-[#062A25]">
                              {vehicule.marque} {vehicule.modele}
                            </h4>

                            <p className="mt-1 text-sm text-gray-500">
                              {vehicule.nombre_places} places
                            </p>

                            {vehicule.immatriculation && (
                              <p className="mt-1 text-xs text-gray-400 uppercase">
                                {vehicule.immatriculation}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PLAN DES SIÈGES */}

              {donnees.vehicule && sieges.length > 0 && (
                <div className="border border-gray-100 rounded-3xl p-4 sm:p-6 bg-[#FCFDFD]">
                  <div className="mb-5">
                    <h3 className="font-bold text-[#062A25]">
                      💺 Organisation des sièges
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      Reproduisez la disposition réelle des sièges de votre
                      véhicule.
                    </p>
                  </div>

                  <PlanSieges
                    sieges={sieges}
                    setSieges={setSieges}
                    positions={positions}
                    setPositions={setPositions}
                  />
                </div>
              )}

              {/* POINTS D'ARRÊT */}

              <div className="border border-gray-100 rounded-3xl p-5 sm:p-6">
                <div className="mb-5">
                  <h3 className="font-bold text-[#062A25]">
                    📍 Points d'arrêt
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Ajoutez éventuellement des lieux de ramassage ou de dépose.
                  </p>
                </div>

                <div className="grid md:grid-cols-[1fr_180px_auto] gap-3">
                  <input
                    type="text"
                    placeholder="Ex : Ambatolampy"
                    value={nouveauPoint.nom_lieu}
                    onChange={(e) =>
                      setNouveauPoint({
                        ...nouveauPoint,
                        nom_lieu: e.target.value,
                      })
                    }
                    className="
                      border
                      border-gray-200
                      rounded-xl
                      px-4
                      py-3
                      focus:ring-2
                      focus:ring-[#23C483]
                      outline-none
                    "
                  />

                  <select
                    value={nouveauPoint.type_point}
                    onChange={(e) =>
                      setNouveauPoint({
                        ...nouveauPoint,
                        type_point: e.target.value,
                      })
                    }
                    className="
                      border
                      border-gray-200
                      rounded-xl
                      px-4
                      py-3
                      outline-none
                    "
                  >
                    <option value="ramassage">Ramassage</option>

                    <option value="depose">Dépose</option>
                  </select>

                  <button
                    type="button"
                    onClick={ajouterPoint}
                    className="
                      bg-[#062A25]
                      text-white
                      rounded-xl
                      font-semibold
                      px-5
                      py-3
                      hover:bg-[#041D19]
                    "
                  >
                    + Ajouter
                  </button>
                </div>

                {pointsArret.length > 0 && (
                  <div className="mt-5 space-y-2">
                    {pointsArret.map((point, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-4 bg-gray-50 rounded-xl px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                            {point.type_point === "depose" ? "🔴" : "🔵"}
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-gray-700">
                              {point.nom_lieu}
                            </p>

                            <p className="text-xs text-gray-400">
                              {point.type_point === "depose"
                                ? "Dépose"
                                : "Ramassage"}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => retirerPoint(index)}
                          className="text-xs font-semibold text-red-500 hover:text-red-700"
                        >
                          Retirer
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* NAVIGATION */}

              <div className="flex justify-between gap-4 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEtape(1)}
                  className="border border-gray-200 px-6 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-50"
                >
                  ← Retour
                </button>

                <button
                  type="button"
                  onClick={continuerEtape2}
                  disabled={verificationConflit}
                  className="
                    bg-[#062A25]
                    text-white
                    px-7
                    py-3
                    rounded-xl
                    font-semibold
                    hover:bg-[#041D19]
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                  "
                >
                  {verificationConflit ? "Vérification..." : "Continuer →"}
                </button>
              </div>
            </div>
          )}

          {/* =================================================
              ÉTAPE 3
          ================================================= */}

          {etape === 3 && (
            <div className="space-y-7">
              <div>
                <span className="text-xs font-bold text-[#23C483] uppercase tracking-wider">
                  Étape 3
                </span>

                <h2 className="mt-2 text-2xl font-bold text-[#062A25]">
                  Tarification et conditions
                </h2>

                <p className="mt-2 text-gray-500">
                  Définissez le prix d'une place et les informations utiles pour
                  les passagers.
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Type de tarification
                    </label>

                    <select
                      value={donnees.type_tarification}
                      onChange={(e) =>
                        setDonnees({
                          ...donnees,
                          type_tarification: e.target.value,
                        })
                      }
                      className="w-full border border-gray-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-[#23C483] outline-none"
                    >
                      <option value="unique">Prix unique par place</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Prix par place
                    </label>

                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={donnees.prix_unique}
                        onChange={(e) =>
                          setDonnees({
                            ...donnees,
                            prix_unique: e.target.value,
                          })
                        }
                        placeholder="Ex : 50000"
                        className="w-full border border-gray-200 rounded-xl px-4 pr-16 py-3.5 focus:ring-2 focus:ring-[#23C483] outline-none"
                      />

                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
                        Ar
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#F0FBF7] border border-[#23C483]/20 rounded-2xl p-5">
                    <p className="text-sm font-semibold text-[#062A25]">
                      💡 Prix indiqué
                    </p>

                    <p className="mt-2 text-sm text-gray-600">
                      Le montant correspond au prix payé par un passager pour
                      une place sur ce trajet.
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      🧳 Politique bagages
                    </label>

                    <textarea
                      value={donnees.politique_bagages}
                      onChange={(e) =>
                        setDonnees({
                          ...donnees,
                          politique_bagages: e.target.value,
                        })
                      }
                      placeholder="Ex : 1 bagage inclus par passager."
                      rows={3}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#23C483] outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ☕ Pauses prévues
                    </label>

                    <textarea
                      value={donnees.pauses_prevues}
                      onChange={(e) =>
                        setDonnees({
                          ...donnees,
                          pauses_prevues: e.target.value,
                        })
                      }
                      placeholder="Ex : Pause à Antsirabe."
                      rows={3}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#23C483] outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📝 Informations complémentaires
                </label>

                <textarea
                  value={donnees.infos_complementaires}
                  onChange={(e) =>
                    setDonnees({
                      ...donnees,
                      infos_complementaires: e.target.value,
                    })
                  }
                  placeholder="Ajoutez toute information utile aux passagers."
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#23C483] outline-none resize-none"
                />
              </div>

              <div className="flex justify-between gap-4 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEtape(2)}
                  className="border border-gray-200 px-6 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-50"
                >
                  ← Retour
                </button>

                <button
                  type="button"
                  onClick={continuerEtape3}
                  className="bg-[#062A25] text-white px-7 py-3 rounded-xl font-semibold hover:bg-[#041D19]"
                >
                  Continuer →
                </button>
              </div>
            </div>
          )}

          {/* =================================================
              ÉTAPE 4
          ================================================= */}

          {etape === 4 && (
            <div className="space-y-7">
              <div>
                <span className="text-xs font-bold text-[#23C483] uppercase tracking-wider">
                  Étape 4
                </span>

                <h2 className="mt-2 text-2xl font-bold text-[#062A25]">
                  Vérifiez votre trajet
                </h2>

                <p className="mt-2 text-gray-500">
                  Vérifiez les informations avant de rendre le trajet disponible
                  aux passagers.
                </p>
              </div>

              {/* RÉSUMÉ PRINCIPAL */}

              <div className="rounded-3xl overflow-hidden border border-gray-100">
                <div className="bg-[#062A25] p-6 text-white">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-white/60 text-xs uppercase tracking-wider">
                        Votre trajet
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xl sm:text-2xl font-bold">
                        <span>{donnees.ville_depart}</span>

                        <span className="text-[#23C483]">→</span>

                        <span>{donnees.ville_arrivee}</span>
                      </div>
                    </div>

                    <div className="hidden sm:flex w-14 h-14 bg-white/10 rounded-2xl items-center justify-center text-2xl">
                      🚗
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 bg-white">
                  <div className="p-5 border-b sm:border-r border-gray-100">
                    <p className="text-xs text-gray-400">Date</p>

                    <p className="mt-1 font-bold text-[#062A25]">
                      {donnees.date_depart}
                    </p>
                  </div>

                  <div className="p-5 border-b lg:border-r border-gray-100">
                    <p className="text-xs text-gray-400">Départ</p>

                    <p className="mt-1 font-bold text-[#062A25]">
                      {donnees.heure_depart}
                    </p>
                  </div>

                  <div className="p-5 border-b sm:border-r border-gray-100">
                    <p className="text-xs text-gray-400">Distance</p>

                    <p className="mt-1 font-bold text-[#062A25]">
                      {donnees.distance_km} km
                    </p>
                  </div>

                  <div className="p-5 border-b border-gray-100">
                    <p className="text-xs text-gray-400">Prix / place</p>

                    <p className="mt-1 font-bold text-[#23C483] text-lg">
                      {Number(donnees.prix_unique).toLocaleString("fr-FR")} Ar
                    </p>
                  </div>
                </div>
              </div>

              {/* AUTRES INFORMATIONS */}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-2xl p-5">
                  <p className="text-xs text-gray-400">Durée estimée</p>

                  <p className="mt-1 font-semibold text-[#062A25]">
                    ⏱ {donnees.duree_estimee || "Non renseignée"}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-2xl p-5">
                  <p className="text-xs text-gray-400">Places proposées</p>

                  <p className="mt-1 font-semibold text-[#062A25]">
                    💺{" "}
                    {
                      sieges.filter(
                        (siege) => !siege.estChauffeur && siege.zone === "plan",
                      ).length
                    }{" "}
                    place(s)
                  </p>
                </div>
              </div>

              {/* POINTS */}

              {pointsArret.length > 0 && (
                <div className="border border-gray-100 rounded-2xl p-5">
                  <h3 className="font-bold text-[#062A25]">
                    📍 Points d'arrêt
                  </h3>

                  <div className="mt-4 space-y-2">
                    {pointsArret.map((point, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 text-sm text-gray-600"
                      >
                        <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold">
                          {index + 1}
                        </span>

                        <span>
                          {point.nom_lieu} —{" "}
                          {point.type_point === "depose"
                            ? "Dépose"
                            : "Ramassage"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CONFIRMATION */}

              <div className="bg-[#F0FBF7] border border-[#23C483]/30 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-[#23C483] rounded-full flex items-center justify-center text-[#062A25] font-bold flex-shrink-0">
                    ✓
                  </div>

                  <div>
                    <p className="font-semibold text-[#062A25]">
                      Prêt à publier
                    </p>

                    <p className="mt-1 text-sm text-gray-600 leading-6">
                      Après publication, les places configurées seront proposées
                      aux passagers MadaGo.
                    </p>
                  </div>
                </div>
              </div>

              {/* NAVIGATION */}

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEtape(3)}
                  disabled={envoi}
                  className="border border-gray-200 px-6 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  ← Modifier
                </button>

                <button
                  type="button"
                  onClick={publierTrajet}
                  disabled={envoi}
                  className="
                    bg-[#23C483]
                    text-[#062A25]
                    px-8
                    py-3.5
                    rounded-xl
                    font-bold
                    hover:bg-[#1fb173]
                    transition
                    shadow-sm
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                  "
                >
                  {envoi ? "Publication en cours..." : "✓ Publier le trajet"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* =================================================
            FOOTER SIMPLE
        ================================================= */}

        <div className="text-center pb-5">
          <p className="text-xs text-gray-400">
            MadaGo • Voyagez ensemble, simplement.
          </p>
        </div>
      </main>
    </div>
  );
}
