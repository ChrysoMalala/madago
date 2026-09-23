import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Spinner from "../../components/Spinner";
import MessageErreur from "../../components/MessageErreur";
import CarteItineraire from "../../components/CarteItineraire";
import PlanSiegesPassager from "../../components/PlanSiegesPassager";
import CarouselAvis from "../../components/CarouselAvis";
import api from "../../api/axios";

export default function DetailTrajet() {
  const { id } = useParams();
  const navigate = useNavigate();
  const estConnecte = !!localStorage.getItem("access_token");

  const [trajet, setTrajet] = useState(null);
  const [donneesAvis, setDonneesAvis] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [etape, setEtape] = useState(1);

  // Vérification réservation
  const [verification, setVerification] = useState(null);
  const [chargementVerif, setChargementVerif] = useState(false);

  // Étape 2 — sélection
  const [siegesChoisis, setSiegesChoisis] = useState([]);
  const [pointRamassage, setPointRamassage] = useState("");
  const [pointDepose, setPointDepose] = useState("");

  // Étape 3 — pour qui est la réservation (nouveau)
  const [typeReservation, setTypeReservation] = useState("soi_meme");
  const [beneficiaireNom, setBeneficiaireNom] = useState("");
  const [beneficiairePrenom, setBeneficiairePrenom] = useState("");
  const [beneficiaireTelephone, setBeneficiaireTelephone] = useState("");

  // Étape 5 — paiement
  const [operateur, setOperateur] = useState("mvola");
  const [numeroTelephone, setNumeroTelephone] = useState("");
  const [codePaiement, setCodePaiement] = useState("");

  // Étape 7 — résultat
  const [reservations, setReservations] = useState([]);
  const [envoi, setEnvoi] = useState(false);
  const [erreurEnvoi, setErreurEnvoi] = useState("");
  const [telechargementEnCours, setTelechargementEnCours] = useState(null);

  // Carte
  const [coordDepart, setCoordDepart] = useState(null);
  const [coordArrivee, setCoordArrivee] = useState(null);
  const [distanceCalculee, setDistanceCalculee] = useState(null);

  // ─── Chargement du trajet ────────────────────────────────────────────
  useEffect(() => {
    const chargerTrajet = async () => {
      try {
        const reponse = await api.get(`/trajets/${id}/`);
        setTrajet(reponse.data);

        // ─── Avis du conducteur ───────────────────────────────────────
        // Le trajet est déjà chargé : on réutilise son conducteur pour
        // récupérer les avis, sans refaire un second appel au trajet.
        const conducteurId =
          reponse.data.conducteur_details?.id || reponse.data.conducteur;

        if (conducteurId) {
          try {
            const resAvis = await api.get(`/avis/conducteur/${conducteurId}/`);
            setDonneesAvis(resAvis.data);
          } catch (errAvis) {
            // Les avis ne doivent pas empêcher l'affichage du trajet.
            console.warn("Impossible de charger les avis du conducteur.", errAvis);
          }
        }

        if (reponse.data.ville_depart && reponse.data.ville_arrivee) {
          geocoderVilles(reponse.data.ville_depart, reponse.data.ville_arrivee);
        }
      } catch (err) {
        console.error(err);
        setErreur("Impossible de charger ce trajet.");
      } finally {
        setChargement(false);
      }
    };
    chargerTrajet();
  }, [id]);

  // ─── Vérification réservation ────────────────────────────────────────
  useEffect(() => {
    const verifierReservation = async () => {
      if (!estConnecte || !trajet) return;
      setChargementVerif(true);
      try {
        const res = await api.get(`/trajets/${id}/verifier-reservation/`);
        setVerification(res.data);
      } catch {
        setVerification({
          peut_reserver: false,
          raison: "Impossible de vérifier la disponibilité.",
        });
      } finally {
        setChargementVerif(false);
      }
    };
    verifierReservation();
  }, [id, trajet, estConnecte]);

  // ─── Géocodage ───────────────────────────────────────────────────────
  const geocoderVille = async (nomVille) => {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      nomVille + ", Madagascar"
    )}&format=json&limit=1`;
    const res = await fetch(url, { headers: { "Accept-Language": "fr" } });
    const data = await res.json();
    if (data.length > 0)
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    return null;
  };

  const geocoderVilles = async (dep, arr) => {
    const [coordDep, coordArr] = await Promise.all([
      geocoderVille(dep),
      geocoderVille(arr),
    ]);
    setCoordDepart(coordDep);
    setCoordArrivee(coordArr);
  };

  const handleDistanceCalculee = useCallback((km) => {
    setDistanceCalculee(km);
  }, []);

  // ─── Données dérivées ────────────────────────────────────────────────
  const estPasse = trajet
    ? new Date(`${trajet.date_depart}T${trajet.heure_depart}`) < new Date()
    : false;

  const siegesDisponibles =
    trajet?.sieges?.filter((s) => s.statut === "disponible") || [];
  const pointsRamassage =
    trajet?.points_arret?.filter((p) => p.type_point === "ramassage") || [];
  const pointsDepose =
    trajet?.points_arret?.filter((p) => p.type_point === "depose") || [];
  const totalAPayer = siegesChoisis.reduce(
    (s, siege) => s + parseFloat(siege.prix || 0),
    0
  );

  const basculerSiege = (siege) => {
    setSiegesChoisis((actuels) => {
      const dejaChoisi = actuels.some((s) => s.id === siege.id);
      if (dejaChoisi) return actuels.filter((s) => s.id !== siege.id);
      return [...actuels, siege];
    });
  };

  // Le formulaire bénéficiaire est valide si soit "pour moi-même", soit
  // "pour une autre personne" ET nom + prénom renseignés (le téléphone
  // reste optionnel, comme décidé pour l'application).
  const etape3Valide =
    typeReservation === "soi_meme" ||
    (beneficiaireNom.trim() !== "" && beneficiairePrenom.trim() !== "");

  // ─── Préfixe téléphone ───────────────────────────────────────────────
  const prefixeOperateur = {
    mvola: "034 / 038",
    orange_money: "032 / 037",
    airtel_money: "033 / 035",
  };

  // ─── Soumission finale ───────────────────────────────────────────────
  const soumettre = async () => {
    setEnvoi(true);
    setErreurEnvoi("");
    try {
      const resultats = [];

      // Un seul code de groupe pour toute la commande, généré côté
      // frontend et envoyé avec chaque réservation. Il permet au
      // backend de régénérer un seul billet PDF listant tous les
      // sièges, même si plusieurs Reservation sont créées.
      const groupeId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `grp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      for (const siege of siegesChoisis) {
        const payload = {
          trajet: trajet.id,
          siege: siege.id,
          point_ramassage: pointRamassage,
          point_depose: pointDepose,
          operateur,
          numero_telephone: numeroTelephone,
          type_reservation: typeReservation,
          groupe_reservation: groupeId,
        };

        if (typeReservation === "autre_personne") {
          payload.beneficiaire_nom = beneficiaireNom;
          payload.beneficiaire_prenom = beneficiairePrenom;
          if (beneficiaireTelephone) {
            payload.beneficiaire_telephone = beneficiaireTelephone;
          }
        }

        const res = await api.post("/reservations/", payload);
        resultats.push(res.data);
      }
      setReservations(resultats);
      setEtape(7);
    } catch (err) {
      setErreurEnvoi(
        err.response?.data
          ? JSON.stringify(err.response.data)
          : "Impossible de finaliser la réservation."
      );
      setEtape(5);
    } finally {
      setEnvoi(false);
    }
  };

  // ─── Téléchargement du billet PDF ────────────────────────────────────
  const handleTelechargerBillet = async (reservationId, codeBillet) => {
    setTelechargementEnCours(reservationId);
    try {
      const res = await api.get(`/reservations/${reservationId}/billet/`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" })
      );
      const lien = document.createElement("a");
      lien.href = url;
      lien.setAttribute("download", `billet_${codeBillet || reservationId}.pdf`);
      document.body.appendChild(lien);
      lien.click();
      lien.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setErreurEnvoi("Erreur lors du téléchargement du billet.");
    } finally {
      setTelechargementEnCours(null);
    }
  };

  // ─── Rendu bouton réserver ───────────────────────────────────────────
  const renderBoutonReserver = () => {
    // Non connecté
    if (!estConnecte) {
      return (
        <button
          onClick={() => navigate("/connexion")}
          className="w-full bg-blue-700 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-800 transition"
        >
          🔐 Se connecter pour réserver
        </button>
      );
    }

    // Trajet passé
    if (estPasse) {
      return (
        <div className="bg-gray-100 border border-gray-200 rounded-xl p-4 text-center text-gray-500 font-medium">
          🕓 Ce trajet a déjà eu lieu — la réservation n'est plus disponible
        </div>
      );
    }

    // Vérification en cours
    if (chargementVerif) {
      return (
        <div className="w-full bg-gray-100 text-gray-500 py-4 rounded-xl font-bold text-lg text-center">
          Vérification en cours...
        </div>
      );
    }

    // Bloqué par règle métier
    if (verification && !verification.peut_reserver) {
      return (
        <div className="space-y-3">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-700 font-medium text-sm text-center">
              🚫 {verification.raison}
            </p>
          </div>
          <button
            disabled
            className="w-full bg-gray-300 text-gray-500 py-4 rounded-xl font-bold text-lg cursor-not-allowed"
          >
            Réservation impossible
          </button>
        </div>
      );
    }

    // Complet
    if (siegesDisponibles.length === 0) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center text-red-700 font-medium">
          ❌ Complet — aucune place disponible
        </div>
      );
    }

    // OK — peut réserver
    return (
      <button
        onClick={() => setEtape(2)}
        className="w-full bg-blue-700 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-800 transition"
      >
        🎫 Réserver ce trajet
      </button>
    );
  };

  // ─── Badge statut trajet ─────────────────────────────────────────────
  const renderBadgeTrajet = () => {
    if (!trajet) return null;

    // Badge "Votre trajet" pour le conducteur
    if (
      verification &&
      !verification.peut_reserver &&
      verification.raison?.includes("conducteur de ce trajet")
    ) {
      return (
        <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
          🚗 Votre trajet
        </span>
      );
    }

    if (estPasse) {
      return (
        <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-3 py-1 rounded-full">
          Terminé
        </span>
      );
    }

    if (trajet.statut === "annule") {
      return (
        <span className="bg-red-100 text-red-600 text-xs font-semibold px-3 py-1 rounded-full">
          Annulé
        </span>
      );
    }

    return null;
  };

  // ─── Chargement / erreur ─────────────────────────────────────────────
  if (chargement)
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-6 py-8">
          <Spinner />
        </div>
      </div>
    );

  if (!trajet)
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-6 py-8">
          <MessageErreur message={erreur || "Trajet introuvable."} />
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* ══════════════════════════════════════════════════
          ÉTAPE 1 — Détail du trajet (2 colonnes + carte)
      ══════════════════════════════════════════════════ */}
      {etape === 1 && (
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

            {/* ── COLONNE GAUCHE ── */}
            <div className="space-y-6">

              {/* Trajet */}
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex justify-between items-start">
                  <h1 className="text-3xl font-bold text-gray-800 mb-1">
                    {trajet.ville_depart} → {trajet.ville_arrivee}
                  </h1>
                  {renderBadgeTrajet()}
                </div>
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                  <span>📅 {trajet.date_depart}</span>
                  <span>⏰ {trajet.heure_depart?.slice(0, 5)}</span>
                  <span>📏 {distanceCalculee || trajet.distance_km} km</span>
                  {trajet.duree_estimee && (
                    <span>⏱️ {trajet.duree_estimee}</span>
                  )}
                </div>
              </div>

              {/* Conducteur — vraies infos, plus placeholder */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">
                  👤 Conducteur
                </h2>
                <div className="flex items-center gap-4">
                  {trajet.conducteur_details?.photo_profil ? (
                    <img
                      src={trajet.conducteur_details.photo_profil}
                      alt="Photo du conducteur"
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
                      👤
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-800">
                        {trajet.conducteur_details
                          ? `${trajet.conducteur_details.prenom} ${trajet.conducteur_details.nom}`
                          : `Conducteur #${trajet.conducteur}`}
                      </p>
                      {trajet.conducteur_details?.verifie && (
                        <span
                          className="text-blue-600 text-sm"
                          title="Identité vérifiée"
                        >
                          ✅
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      ⭐{" "}
                      {trajet.conducteur_details?.note_moyenne
                        ? `${trajet.conducteur_details.note_moyenne} / 5`
                        : "Pas encore noté"}
                      {trajet.conducteur_details?.nombre_trajets_effectues > 0 && (
                        <> · {trajet.conducteur_details.nombre_trajets_effectues} trajet(s) effectué(s)</>
                      )}
                    </p>
                    {trajet.conducteur_details?.membre_depuis && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Membre depuis{" "}
                        {new Date(trajet.conducteur_details.membre_depuis).toLocaleDateString("fr-FR", {
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Véhicule — vraies infos */}
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-lg font-bold text-gray-800">
                    🚗 Véhicule
                  </h2>
                  {trajet.vehicule_details?.verifie && (
                    <span
                      className="text-blue-600 text-sm"
                      title="Véhicule vérifié"
                    >
                      ✅
                    </span>
                  )}
                </div>

                {(trajet.vehicule_details?.photo_exterieure ||
                  trajet.vehicule_details?.photo_interieure) && (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {trajet.vehicule_details?.photo_exterieure && (
                      <img
                        src={trajet.vehicule_details.photo_exterieure}
                        alt="Extérieur du véhicule"
                        className="rounded-lg h-24 w-full object-cover"
                      />
                    )}
                    {trajet.vehicule_details?.photo_interieure && (
                      <img
                        src={trajet.vehicule_details.photo_interieure}
                        alt="Intérieur du véhicule"
                        className="rounded-lg h-24 w-full object-cover"
                      />
                    )}
                  </div>
                )}

                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    🚘{" "}
                    {trajet.vehicule_details
                      ? `${trajet.vehicule_details.marque} ${trajet.vehicule_details.modele} · ${trajet.vehicule_details.couleur}`
                      : `Véhicule #${trajet.vehicule}`}
                  </p>
                  <p>💺 {trajet.sieges?.filter(s => !s.est_chauffeur).length || 0} places au total</p>
                  <p>✅ {siegesDisponibles.length} place(s) disponible(s)</p>
                  {trajet.vehicule_details?.equipements && (
                    <p>🔧 {trajet.vehicule_details.equipements}</p>
                  )}
                </div>
              </div>

              {/* Points de ramassage / dépose disponibles */}
              {(pointsRamassage.length > 0 || pointsDepose.length > 0) && (
                <div className="bg-white rounded-xl shadow p-6">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">
                    📍 Points de ramassage et de dépose
                  </h2>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400 text-xs font-medium mb-1">
                        🟢 Ramassage
                      </p>
                      <ul className="text-gray-600 space-y-0.5">
                        {pointsRamassage.map((p) => (
                          <li key={p.id}>{p.nom_lieu}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs font-medium mb-1">
                        🔴 Dépose
                      </p>
                      <ul className="text-gray-600 space-y-0.5">
                        {pointsDepose.map((p) => (
                          <li key={p.id}>{p.nom_lieu}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Infos complémentaires */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">
                  ℹ️ Informations
                </h2>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between items-center">
                    <span>Prix par place</span>
                    <span className="font-bold text-blue-700 text-lg">
                      {parseFloat(trajet.prix_unique || 0).toLocaleString()} Ar
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Places disponibles</span>
                    <span className="font-semibold text-green-600">
                      {siegesDisponibles.length} place(s)
                    </span>
                  </div>
                  {trajet.politique_bagages && (
                    <p className="mt-2">🧳 {trajet.politique_bagages}</p>
                  )}
                  {trajet.pauses_prevues && (
                    <p>⏸️ {trajet.pauses_prevues}</p>
                  )}
                  {trajet.infos_complementaires && (
                    <p>📝 {trajet.infos_complementaires}</p>
                  )}
                </div>
              </div>

              {/* Conditions d'annulation et de remboursement */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">
                  📋 Conditions d'annulation
                </h2>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    ✅ <strong>Plus d'1h avant le départ</strong> : remboursement
                    de 100 % du montant payé, hors frais de transfert Mobile
                    Money (2 %).
                  </p>
                  <p>
                    ⚠️ <strong>Moins d'1h avant le départ</strong> : seul 50 %
                    du montant payé est remboursé.
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Le remboursement, une fois déclenché, est traité
                    immédiatement.
                  </p>
                </div>
              </div>

              {/* Bouton réserver */}
              {renderBoutonReserver()}

              {/* ══════════════════════════════════════════════════
                  AVIS DU CONDUCTEUR — carousel horizontal, affiché
                  juste après le bouton de réservation.
                 ══════════════════════════════════════════════════ */}
              {donneesAvis && (
                donneesAvis.avis?.length > 0 ? (
                  <div className="bg-white rounded-xl shadow p-6">
                    <CarouselAvis
                      avis={donneesAvis.avis}
                      titre="💬 Ce que disent les passagers"
                    />
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow p-6">
                    <p className="text-gray-400 text-sm text-center">
                      Aucun avis pour ce conducteur pour le moment.
                    </p>
                  </div>
                )
              )}
            </div>

            {/* ── COLONNE DROITE — Carte ── */}
            <div className="sticky top-24 h-[calc(100vh-120px)] rounded-xl overflow-hidden shadow-lg">
              {coordDepart && coordArrivee ? (
                <CarteItineraire
                  coordDepart={coordDepart}
                  coordArrivee={coordArrivee}
                  villeDepart={trajet.ville_depart}
                  villeArrivee={trajet.ville_arrivee}
                  onDistanceCalculee={handleDistanceCalculee}
                />
              ) : (
                <div className="h-full bg-gray-100 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <p className="text-4xl mb-2">🗺️</p>
                    <p>Chargement de la carte...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          ÉTAPE 2 — Sélection des sièges
      ══════════════════════════════════════════════════ */}
      {etape === 2 && !estPasse && (
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => setEtape(1)}
              className="text-gray-500 hover:text-gray-700"
            >
              ← Retour
            </button>
            <h1 className="text-2xl font-bold text-gray-800">
              Choisir vos sièges
            </h1>
          </div>

          {/* Rappel trajet */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="font-semibold text-blue-800">
              {trajet.ville_depart} → {trajet.ville_arrivee}
            </p>
            <p className="text-sm text-blue-600 mt-1">
              📅 {trajet.date_depart} · ⏰ {trajet.heure_depart?.slice(0, 5)}{" "}
              · 💰{" "}
              {parseFloat(trajet.prix_unique || 0).toLocaleString()} Ar/place
            </p>
          </div>

          {/* Plan des sièges */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">
                🪑 Plan des sièges
              </h2>
              <span className="text-sm text-gray-500">
                {siegesChoisis.length} sélectionné(s)
              </span>
            </div>
            <PlanSiegesPassager
              sieges={trajet.sieges || []}
              siegesChoisis={siegesChoisis}
              onToggle={basculerSiege}
            />
          </div>

          {/* Points + Prix */}
          {siegesChoisis.length > 0 && (
            <div className="bg-white rounded-xl shadow p-6 space-y-4">
              <h2 className="text-lg font-bold text-gray-800">
                📍 Points de trajet
              </h2>

              {pointsRamassage.length === 0 || pointsDepose.length === 0 ? (
                <MessageErreur message="Aucun point de ramassage/dépose défini. La réservation n'est pas encore possible." />
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Point de ramassage
                    </label>
                    <select
                      value={pointRamassage}
                      onChange={(e) => setPointRamassage(e.target.value)}
                      className="w-full border rounded-lg px-4 py-2"
                    >
                      <option value="">-- Choisir --</option>
                      {pointsRamassage.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nom_lieu}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Point de dépose
                    </label>
                    <select
                      value={pointDepose}
                      onChange={(e) => setPointDepose(e.target.value)}
                      className="w-full border rounded-lg px-4 py-2"
                    >
                      <option value="">-- Choisir --</option>
                      {pointsDepose.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nom_lieu}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Total */}
                  <div className="bg-blue-50 rounded-lg px-4 py-3 flex justify-between items-center">
                    <span className="text-sm text-gray-700">
                      {siegesChoisis.length} place(s) ×{" "}
                      {parseFloat(trajet.prix_unique || 0).toLocaleString()} Ar
                    </span>
                    <span className="text-xl font-bold text-blue-700">
                      {totalAPayer.toLocaleString()} Ar
                    </span>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setEtape(1)}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => setEtape(3)}
                      disabled={!pointRamassage || !pointDepose}
                      className="flex-1 bg-blue-700 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-50"
                    >
                      Continuer →
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          ÉTAPE 3 — Pour qui est cette réservation ? (nouveau)
      ══════════════════════════════════════════════════ */}
      {etape === 3 && !estPasse && (
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => setEtape(2)}
              className="text-gray-500 hover:text-gray-700"
            >
              ← Retour
            </button>
            <h1 className="text-2xl font-bold text-gray-800">
              Pour qui est cette réservation ?
            </h1>
          </div>

          <p className="text-sm text-gray-500">
            {siegesChoisis.length > 1
              ? `Ce choix s'appliquera aux ${siegesChoisis.length} places sélectionnées.`
              : "Ce choix s'appliquera à la place sélectionnée."}
          </p>

          <div className="bg-white rounded-xl shadow p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTypeReservation("soi_meme")}
                className={`p-4 rounded-xl border-2 text-center transition ${
                  typeReservation === "soi_meme"
                    ? "border-blue-700 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <p className="text-2xl mb-1">🙋</p>
                <p className="text-sm font-semibold text-gray-700">
                  Pour moi-même
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTypeReservation("autre_personne")}
                className={`p-4 rounded-xl border-2 text-center transition ${
                  typeReservation === "autre_personne"
                    ? "border-blue-700 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <p className="text-2xl mb-1">👥</p>
                <p className="text-sm font-semibold text-gray-700">
                  Pour une autre personne
                </p>
              </button>
            </div>

            {typeReservation === "autre_personne" && (
              <div className="space-y-3 pt-2 border-t">
                <p className="text-sm text-gray-500">
                  Ces informations apparaîtront sur le billet, pour que la
                  personne puisse se présenter au point de ramassage.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prénom *
                    </label>
                    <input
                      value={beneficiairePrenom}
                      onChange={(e) => setBeneficiairePrenom(e.target.value)}
                      placeholder="Jean"
                      className="w-full border rounded-lg px-4 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom *
                    </label>
                    <input
                      value={beneficiaireNom}
                      onChange={(e) => setBeneficiaireNom(e.target.value)}
                      placeholder="Rakoto"
                      className="w-full border rounded-lg px-4 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone <span className="text-gray-400 font-normal">(optionnel)</span>
                  </label>
                  <input
                    value={beneficiaireTelephone}
                    onChange={(e) => setBeneficiaireTelephone(e.target.value)}
                    placeholder="034 XX XXX XX"
                    className="w-full border rounded-lg px-4 py-2"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setEtape(2)}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200"
            >
              ← Retour
            </button>
            <button
              onClick={() => setEtape(4)}
              disabled={!etape3Valide}
              className="flex-1 bg-blue-700 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-50"
            >
              Continuer →
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          ÉTAPE 4 — Récapitulatif
      ══════════════════════════════════════════════════ */}
      {etape === 4 && !estPasse && (
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => setEtape(3)}
              className="text-gray-500 hover:text-gray-700"
            >
              ← Retour
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Récapitulatif</h1>
          </div>

          <div className="bg-white rounded-xl shadow p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-800">
              🎫 Votre réservation
            </h2>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex justify-between">
                <span className="text-gray-500">Trajet</span>
                <span className="font-semibold">
                  {trajet.ville_depart} → {trajet.ville_arrivee}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date</span>
                <span>{trajet.date_depart}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Heure</span>
                <span>{trajet.heure_depart?.slice(0, 5)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Sièges</span>
                <span>
                  {siegesChoisis.map((s) => `N°${s.numero_siege}`).join(", ")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Voyageur(s)</span>
                <span>
                  {typeReservation === "autre_personne"
                    ? `${beneficiairePrenom} ${beneficiaireNom}`
                    : "Vous-même"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ramassage</span>
                <span>
                  {pointsRamassage.find(
                    (p) => String(p.id) === String(pointRamassage)
                  )?.nom_lieu}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Dépose</span>
                <span>
                  {pointsDepose.find(
                    (p) => String(p.id) === String(pointDepose)
                  )?.nom_lieu}
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between items-center">
                <span className="font-bold text-gray-800">Total à payer</span>
                <span className="font-bold text-blue-700 text-xl">
                  {totalAPayer.toLocaleString()} Ar
                </span>
              </div>
            </div>
          </div>

          {/* Conditions */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-3">
              📋 Conditions
            </h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Le paiement est sécurisé via le système escrow MadaGo.</p>
              <p>• Les fonds sont versés au conducteur uniquement après l'arrivée à destination.</p>
              <p>• Annulation gratuite jusqu'à 24h avant le départ.</p>
              <p>• Remboursement de 50% entre 12h et 24h avant le départ.</p>
              <p>• Aucun remboursement dans les 12h précédant le départ.</p>
              {trajet.politique_bagages && (
                <p>• Bagages : {trajet.politique_bagages}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setEtape(3)}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200"
            >
              ← Modifier
            </button>
            <button
              onClick={() => setEtape(5)}
              className="flex-1 bg-blue-700 text-white py-3 rounded-lg font-semibold hover:bg-blue-800"
            >
              Procéder au paiement →
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          ÉTAPE 5 — Paiement Mobile Money
      ══════════════════════════════════════════════════ */}
      {etape === 5 && !estPasse && (
        <div className="max-w-md mx-auto px-6 py-8 space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => setEtape(4)}
              className="text-gray-500 hover:text-gray-700"
            >
              ← Retour
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Paiement</h1>
          </div>

          {erreurEnvoi && <MessageErreur message={erreurEnvoi} />}

          {/* Montant */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-600">Montant total</p>
            <p className="text-3xl font-bold text-blue-700 mt-1">
              {totalAPayer.toLocaleString()} Ar
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Frais de transfert : inclus · Frais de retrait : 0 Ar
            </p>
          </div>

          {/* Choix opérateur */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Choisissez votre opérateur
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "mvola", label: "MVola", emoji: "🟠", prefixe: "034 / 038" },
                { id: "orange_money", label: "Orange Money", emoji: "🟡", prefixe: "032 / 037" },
                { id: "airtel_money", label: "Airtel Money", emoji: "🔴", prefixe: "033 / 035" },
              ].map((op) => (
                <button
                  key={op.id}
                  onClick={() => { setOperateur(op.id); setNumeroTelephone(""); }}
                  className={`p-4 rounded-xl border-2 text-center transition ${
                    operateur === op.id
                      ? "border-blue-700 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className="text-2xl mb-1">{op.emoji}</p>
                  <p className="text-xs font-semibold text-gray-700">{op.label}</p>
                  <p className="text-xs text-gray-400 mt-1">{op.prefixe}</p>
                </button>
              ))}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numéro{" "}
                {operateur === "mvola" ? "MVola" : operateur === "orange_money" ? "Orange Money" : "Airtel Money"}
                <span className="text-gray-400 font-normal ml-1">
                  ({prefixeOperateur[operateur]})
                </span>
              </label>
              <input
                value={numeroTelephone}
                onChange={(e) => setNumeroTelephone(e.target.value)}
                placeholder={
                  operateur === "mvola" ? "034 XX XXX XX"
                  : operateur === "orange_money" ? "032 XX XXX XX"
                  : "033 XX XXX XX"
                }
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>
          </div>

          <button
            onClick={() => setEtape(6)}
            disabled={!numeroTelephone}
            className="w-full bg-blue-700 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-800 disabled:opacity-50"
          >
            Confirmer le paiement →
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          ÉTAPE 6 — Simulation téléphone + code secret
      ══════════════════════════════════════════════════ */}
      {etape === 6 && !estPasse && (
        <div className="max-w-md mx-auto px-6 py-8 space-y-6">
          <h1 className="text-2xl font-bold text-gray-800 text-center">
            Confirmation Mobile Money
          </h1>

          <div className="flex justify-center">
            <div className="w-64 bg-gray-900 rounded-3xl p-4 shadow-2xl">
              <div className="w-16 h-4 bg-gray-800 rounded-full mx-auto mb-4" />
              <div className="bg-white rounded-2xl p-4 min-h-48">
                <p className="text-xs text-gray-500 text-center mb-3">
                  {operateur === "mvola" ? "MVola"
                    : operateur === "orange_money" ? "Orange Money"
                    : "Airtel Money"}
                </p>
                <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 mb-4">
                  <p className="font-semibold mb-1">Notification de paiement</p>
                  <p>
                    Vous avez reçu une demande de paiement de{" "}
                    <strong>{totalAPayer.toLocaleString()} Ar</strong> de la part de{" "}
                    <strong>MadaGo</strong>.
                  </p>
                  <p className="mt-2">Entrez votre code secret pour confirmer.</p>
                </div>

                <div className="flex justify-center gap-2 mb-4">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i}
                      className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center">
                      {codePaiement[i] ? "●" : ""}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "⌫"].map((touche, i) => (
                    <button
                      key={i}
                      type="button"
                      disabled={touche === ""}
                      onClick={() => {
                        if (touche === "⌫") {
                          setCodePaiement((prev) => prev.slice(0, -1));
                        } else if (codePaiement.length < 4) {
                          setCodePaiement((prev) => prev + String(touche));
                        }
                      }}
                      className={`py-2 rounded-lg text-sm font-semibold transition ${
                        touche === "" ? "invisible"
                        : "bg-gray-100 hover:bg-gray-200 active:bg-gray-300"
                      }`}
                    >
                      {touche}
                    </button>
                  ))}
                </div>
              </div>
              <div className="w-24 h-1 bg-gray-700 rounded-full mx-auto mt-4" />
            </div>
          </div>

          <button
            onClick={soumettre}
            disabled={codePaiement.length < 4 || envoi}
            className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 disabled:opacity-50"
          >
            {envoi ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                Traitement en cours...
              </span>
            ) : (
              "Valider le paiement"
            )}
          </button>

          <p className="text-center text-sm text-red-600 font-medium">
            ⚠️ Ne fermez pas cette page, votre paiement est en cours de traitement.
          </p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          ÉTAPE 7 — Confirmation + Billet
      ══════════════════════════════════════════════════ */}
      {etape === 7 && (
        <div className="max-w-md mx-auto px-6 py-8 space-y-6">
          <div className="text-center">
            <p className="text-6xl mb-4">🎉</p>
            <h1 className="text-2xl font-bold text-gray-800">
              Votre réservation est confirmée !
            </h1>
            <p className="text-gray-500 mt-2">
              Votre paiement a été effectué avec succès.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200"
            id="billet-reservation">
            <div className="bg-blue-700 text-white p-4 text-center">
              <p className="text-xl font-bold">🚗 MadaGo</p>
              <p className="text-sm opacity-80 mt-1">Billet de voyage</p>
            </div>

            <div className="p-6 space-y-3 text-sm">
              <div className="text-center mb-4">
                <p className="text-2xl font-bold text-gray-800">
                  {trajet.ville_depart} → {trajet.ville_arrivee}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-gray-600">
                <div>
                  <p className="text-xs text-gray-400">Date</p>
                  <p className="font-semibold">{trajet.date_depart}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Heure</p>
                  <p className="font-semibold">{trajet.heure_depart?.slice(0, 5)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Sièges</p>
                  <p className="font-semibold">
                    {siegesChoisis.map((s) => `N°${s.numero_siege}`).join(", ")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Places</p>
                  <p className="font-semibold">{siegesChoisis.length} place(s)</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Voyageur(s)</p>
                  <p className="font-semibold">
                    {typeReservation === "autre_personne"
                      ? `${beneficiairePrenom} ${beneficiaireNom}`
                      : "Vous-même"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Ramassage</p>
                  <p className="font-semibold">
                    {pointsRamassage.find(
                      (p) => String(p.id) === String(pointRamassage)
                    )?.nom_lieu}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Dépose</p>
                  <p className="font-semibold">
                    {pointsDepose.find(
                      (p) => String(p.id) === String(pointDepose)
                    )?.nom_lieu}
                  </p>
                </div>
              </div>

              <div className="border-t pt-3 flex justify-between items-center">
                <span className="text-gray-500">Total payé</span>
                <span className="font-bold text-blue-700 text-lg">
                  {totalAPayer.toLocaleString()} Ar
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Opérateur</span>
                <span className="font-semibold">
                  {operateur === "mvola" ? "MVola"
                    : operateur === "orange_money" ? "Orange Money"
                    : "Airtel Money"}
                </span>
              </div>

              {reservations.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 mt-2 space-y-2">
                  <p className="text-xs text-gray-400 mb-1">
                    {reservations.length > 1
                      ? `${reservations.length} places réservées`
                      : "Réservation"}
                  </p>
                  {reservations.map((r) => {
                    const resa = r.reservation || r;
                    return (
                      <p key={resa.id} className="font-mono text-xs text-gray-700">
                        #{resa.id} · {resa.code_billet}
                      </p>
                    );
                  })}
                  <button
                    onClick={() => {
                      const premiere = reservations[0].reservation || reservations[0];
                      handleTelechargerBillet(
                        premiere.id,
                        premiere.groupe_reservation || premiere.code_billet
                      );
                    }}
                    disabled={telechargementEnCours !== null}
                    className="w-full mt-2 text-sm bg-blue-700 text-white px-3 py-2 rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-50"
                  >
                    {telechargementEnCours !== null
                      ? "Génération..."
                      : reservations.length > 1
                      ? "🎫 Télécharger le billet (toutes les places)"
                      : "🎫 Télécharger le billet"}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Link
              to="/passager/reservations"
              className="block w-full bg-blue-700 text-white py-3 rounded-xl font-semibold text-center hover:bg-blue-800"
            >
              Voir mes réservations →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}