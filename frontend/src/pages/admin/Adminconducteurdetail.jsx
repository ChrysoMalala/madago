import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import adminApi from "../../api/adminAxios";

const URL_BACKEND = "http://127.0.0.1:8000";
const urlImage = (chemin) => (chemin ? `${URL_BACKEND}${chemin}` : null);

const BADGES_CONDUCTEUR = {
  en_attente: {
    texte: "⏳ En attente",
    classe: "bg-yellow-100 text-yellow-800",
  },
  valide: { texte: "✅ Validé", classe: "bg-green-100 text-green-800" },
  rejete: { texte: "❌ Rejeté", classe: "bg-red-100 text-red-800" },
};

const BADGES_VEHICULE = {
  en_attente: {
    texte: "⏳ En attente",
    classe: "bg-yellow-100 text-yellow-800",
  },
  valide: { texte: "✅ Validé", classe: "bg-green-100 text-green-800" },
  rejete: { texte: "❌ Rejeté", classe: "bg-red-100 text-red-800" },
  suspendu: { texte: "⛔ Suspendu", classe: "bg-orange-100 text-orange-800" },
};

const ONGLETS_TRAJETS = [
  { cle: "a_venir", label: "À venir" },
  { cle: "en_cours", label: "En cours" },
  { cle: "passes", label: "Passés" },
];

const BADGES_RESERVATION = {
  confirmee: { texte: "🔵 Confirmée", classe: "bg-blue-100 text-blue-800" },
  annulee: { texte: "🔴 Annulée", classe: "bg-red-100 text-red-800" },
  remboursee: { texte: "⚪ Remboursée", classe: "bg-gray-100 text-gray-800" },
};

const ICONES_HISTORIQUE = {
  validation_conducteur: { icone: "✅", classe: "bg-green-100 text-green-800" },
  rejet_conducteur: { icone: "❌", classe: "bg-red-100 text-red-800" },
  validation_vehicule: { icone: "✅", classe: "bg-green-100 text-green-800" },
  rejet_vehicule: { icone: "❌", classe: "bg-red-100 text-red-800" },
  suspension_vehicule: { icone: "⛔", classe: "bg-orange-100 text-orange-800" },
  confirmation_depart: { icone: "🚦", classe: "bg-blue-100 text-blue-800" },
  confirmation_fin: { icone: "🏁", classe: "bg-gray-100 text-gray-800" },
  transfert_revenus: { icone: "💰", classe: "bg-yellow-100 text-yellow-800" },
};

export default function AdminConducteurDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ── États ──────────────────────────────────────────────────────────
  const [conducteur, setConducteur] = useState(null);
  const [vehicules, setVehicules] = useState([]);
  const [trajets, setTrajets] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const [motifRejet, setMotifRejet] = useState("");
  const [rejetOuvert, setRejetOuvert] = useState(false);
  const [rejetVehiculeOuvert, setRejetVehiculeOuvert] = useState(null);
  const [motifRejetVehicule, setMotifRejetVehicule] = useState("");
  const [vehiculeOuvert, setVehiculeOuvert] = useState(null);

  const [imageAgrandie, setImageAgrandie] = useState(null);

  const [ongletTrajets, setOngletTrajets] = useState("a_venir");
  const [trajetOuvert, setTrajetOuvert] = useState(null);
  const [reservationsParTrajet, setReservationsParTrajet] = useState({});
  const [chargementReservations, setChargementReservations] = useState(false);

  // ── Chargement des données ─────────────────────────────────────────
  const charger = async () => {
    setChargement(true);
    setErreur("");
    try {
      const [resConducteur, resVehicules, resTrajets, resHistorique] =
        await Promise.all([
          adminApi.get(`/conducteurs/${id}/detail-admin/`),
          adminApi.get("/admin/vehicules/", { params: { conducteur: id } }),
          adminApi.get(`/admin/conducteurs/${id}/trajets/`),
          adminApi.get(`/conducteurs/${id}/historique/`),
        ]);
      setConducteur(resConducteur.data);
      setVehicules(resVehicules.data);
      setTrajets(resTrajets.data);
      setHistorique(resHistorique.data);
    } catch (err) {
      console.error(err);
      setErreur("Impossible de charger ce conducteur.");
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    charger();
  }, [id]);

  // ── Actions conducteur ─────────────────────────────────────────────
  const validerConducteur = async () => {
    try {
      await adminApi.put(`/conducteurs/${id}/valider/`, { statut: "valide" });
      charger();
    } catch (err) {
      console.error(err);
      setErreur("Impossible de valider ce conducteur.");
    }
  };

  const rejeterConducteur = async () => {
    try {
      await adminApi.put(`/conducteurs/${id}/valider/`, {
        statut: "rejete",
        motif_rejet: motifRejet,
      });
      setRejetOuvert(false);
      setMotifRejet("");
      charger();
    } catch (err) {
      console.error(err);
      setErreur("Impossible de rejeter ce conducteur.");
    }
  };

  // ── Actions véhicule ───────────────────────────────────────────────
  const changerStatutVehicule = async (vehiculeId, statut) => {
    try {
      await adminApi.put(`/admin/vehicules/${vehiculeId}/valider/`, {
        statut,
        motif_rejet: statut === "rejete" ? motifRejetVehicule : undefined,
      });
      setRejetVehiculeOuvert(null);
      setMotifRejetVehicule("");
      charger();
    } catch (err) {
      console.error(err);
      setErreur("Impossible de mettre à jour ce véhicule.");
    }
  };

  // ── Actions trajet ─────────────────────────────────────────────────
  const basculerTrajet = async (trajetId) => {
    if (trajetOuvert === trajetId) {
      setTrajetOuvert(null);
      return;
    }
    setTrajetOuvert(trajetId);
    if (!reservationsParTrajet[trajetId]) {
      setChargementReservations(true);
      try {
        const reponse = await adminApi.get(
          `/admin/trajets/${trajetId}/reservations/`,
        );
        setReservationsParTrajet((prev) => ({
          ...prev,
          [trajetId]: reponse.data,
        }));
      } catch (err) {
        console.error(err);
      } finally {
        setChargementReservations(false);
      }
    }
  };

  const trajetsFiltres = trajets.filter((t) => {
    if (ongletTrajets === "a_venir") return t.statut === "a_venir";
    if (ongletTrajets === "en_cours") return t.statut === "en_cours";
    return t.statut === "termine" || t.statut === "annule";
  });

  // ── Écrans de chargement / erreur ──────────────────────────────────
  if (chargement) {
    return (
      <AdminLayout titre="Fiche conducteur">
        <p className="text-slate-500">Chargement...</p>
      </AdminLayout>
    );
  }

  if (!conducteur) {
    return (
      <AdminLayout titre="Fiche conducteur">
        <p className="text-red-600">{erreur || "Conducteur introuvable."}</p>
      </AdminLayout>
    );
  }

  const badge =
    BADGES_CONDUCTEUR[conducteur.statut_validation] ||
    BADGES_CONDUCTEUR.en_attente;
  const u = conducteur.utilisateur_info;

  return (
    <AdminLayout titre={`${u?.prenom} ${u?.nom}`}>
      <button
        onClick={() => navigate("/admin/conducteurs")}
        className="text-sm text-slate-500 mb-4 hover:underline"
      >
        ← Retour à la liste
      </button>

      {erreur && <p className="text-red-600 text-sm mb-4">{erreur}</p>}

      {/* ── SECTION A — Informations du conducteur ── */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-bold text-slate-800">
            👤 Informations du conducteur
          </h2>
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full ${badge.classe}`}
          >
            {badge.texte}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm mb-6">
          <div>
            <p className="text-slate-400">Nom complet</p>
            <p className="font-medium text-slate-800">
              {u?.prenom} {u?.nom}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Email</p>
            <p className="font-medium text-slate-800">{u?.email}</p>
          </div>
          <div>
            <p className="text-slate-400">Téléphone</p>
            <p className="font-medium text-slate-800">{u?.telephone}</p>
          </div>
          <div>
            <p className="text-slate-400">Date de naissance</p>
            <p className="font-medium text-slate-800">
              {conducteur.date_naissance}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Lieu de naissance</p>
            <p className="font-medium text-slate-800">
              {conducteur.lieu_naissance}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Permis</p>
            <p className="font-medium text-slate-800">
              {conducteur.numero_permis} ({conducteur.categorie_permis})
            </p>
          </div>
          <div>
            <p className="text-slate-400">Mobile Money</p>
            <p className="font-medium text-slate-800">
              {conducteur.operateur_mobile_money} —{" "}
              {conducteur.numero_mobile_money}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Titulaire Mobile Money</p>
            <p className="font-medium text-slate-800">
              {conducteur.titulaire_mobile_money}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Contact d'urgence</p>
            <p className="font-medium text-slate-800">
              {conducteur.contact_urgence_nom} —{" "}
              {conducteur.contact_urgence_telephone}
            </p>
          </div>
        </div>

        <p className="text-sm font-semibold text-slate-600 mb-2">Documents</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { label: "CIN recto", src: conducteur.cin_recto },
            { label: "CIN verso", src: conducteur.cin_verso },
            { label: "Permis recto", src: conducteur.permis_recto },
            { label: "Permis verso", src: conducteur.permis_verso },
          ].map(
            (doc) =>
              urlImage(doc.src) && (
                <button
                  key={doc.label}
                  onClick={() => setImageAgrandie(urlImage(doc.src))}
                  className="text-left"
                >
                  <img
                    src={urlImage(doc.src)}
                    alt={doc.label}
                    className="rounded-lg border w-full h-24 object-cover hover:opacity-80 transition"
                  />
                  <p className="text-xs text-slate-400 mt-1">{doc.label}</p>
                </button>
              ),
          )}
        </div>

        {conducteur.statut_validation === "rejete" &&
          conducteur.motif_rejet && (
            <p className="text-sm text-red-600 mb-3">
              Motif du rejet : {conducteur.motif_rejet}
            </p>
          )}

        {conducteur.statut_validation === "en_attente" && (
          <div className="flex gap-2 items-center flex-wrap">
            <button
              onClick={validerConducteur}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700"
            >
              ✅ Valider le dossier
            </button>
            {rejetOuvert ? (
              <>
                <input
                  value={motifRejet}
                  onChange={(e) => setMotifRejet(e.target.value)}
                  placeholder="Motif du rejet (obligatoire)"
                  className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px]"
                />
                <button
                  onClick={rejeterConducteur}
                  disabled={!motifRejet.trim()}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                >
                  Confirmer le rejet
                </button>
                <button
                  onClick={() => {
                    setRejetOuvert(false);
                    setMotifRejet("");
                  }}
                  className="text-slate-500 text-sm"
                >
                  Annuler
                </button>
              </>
            ) : (
              <button
                onClick={() => setRejetOuvert(true)}
                className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-200"
              >
                ❌ Rejeter le dossier
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── SECTION B — Véhicules ── */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">
          🚗 Véhicules ({vehicules.length}/5)
        </h2>

        {vehicules.length === 0 ? (
          <p className="text-slate-500 text-sm">Aucun véhicule enregistré.</p>
        ) : (
          <div className="space-y-4">
            {vehicules.map((v) => {
              const badgeV =
                BADGES_VEHICULE[v.statut_validation] ||
                BADGES_VEHICULE.en_attente;
              const alertes = v.alertes_vehicule || [];
              const estOuvert =
                rejetVehiculeOuvert === v.id || v.id === vehiculeOuvert;
              return (
                <div
                  key={v.id}
                  className="border border-slate-100 rounded-xl overflow-hidden"
                >
                  {/* ── En-tête toujours visible ── */}
                  {/* ── En-tête toujours visible ── */}
                  <div
                    onClick={() => {
                      if (v.statut_validation === "en_attente") {
                        setVehiculeOuvert(
                          vehiculeOuvert === v.id ? null : v.id,
                        );
                      }
                    }}
                    className={`w-full flex justify-between items-start p-4 text-left ${
                      v.statut_validation === "en_attente"
                        ? "hover:bg-slate-50 cursor-pointer"
                        : "cursor-default"
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-800">
                          {v.marque} {v.modele}
                        </h3>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeV.classe}`}
                        >
                          {badgeV.texte}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">
                        🪪 {v.immatriculation} · {v.annee} · {v.nombre_places}{" "}
                        places · {v.type_carburant}
                      </p>

                      {/* Badges alertes */}
                      {alertes.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {alertes.map((alerte, i) => (
                            <span
                              key={i}
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${alerte.classe}`}
                            >
                              {alerte.icone} {alerte.texte}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {v.statut_validation === "en_attente" && (
                      <span className="text-slate-400 text-sm ml-2">
                        {vehiculeOuvert === v.id ? "▲" : "▼"}
                      </span>
                    )}
                  </div>
                  {/* ── Détail — uniquement pour véhicule en attente ── */}
                  {v.statut_validation === "en_attente" &&
                    vehiculeOuvert === v.id && (
                      <div className="border-t border-slate-100 p-4 space-y-4 bg-slate-50">
                        {/* Infos complètes */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-slate-400">Type</p>
                            <p className="font-medium">{v.type_vehicule}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Couleur</p>
                            <p className="font-medium">{v.couleur}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Carburant</p>
                            <p className="font-medium">{v.type_carburant}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">N° assurance</p>
                            <p className="font-medium">{v.numero_assurance}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Exp. assurance</p>
                            <p className="font-medium">
                              {v.date_expiration_assurance}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400">Visite technique</p>
                            <p className="font-medium">
                              {v.date_visite_technique}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400">Exp. visite</p>
                            <p className="font-medium">
                              {v.date_expiration_visite}
                            </p>
                          </div>
                          {v.numero_licence && (
                            <div>
                              <p className="text-slate-400">Licence</p>
                              <p className="font-medium">{v.numero_licence}</p>
                            </div>
                          )}
                          {v.cooperative && (
                            <div>
                              <p className="text-slate-400">Coopérative</p>
                              <p className="font-medium">{v.cooperative}</p>
                            </div>
                          )}
                          {v.zone_exploitation && (
                            <div>
                              <p className="text-slate-400">Zone</p>
                              <p className="font-medium">
                                {v.zone_exploitation}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Documents */}
                        <div>
                          <p className="text-sm font-semibold text-slate-600 mb-2">
                            Documents
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                              {
                                label: "Carte grise recto",
                                src: v.carte_grise_recto,
                              },
                              {
                                label: "Carte grise verso",
                                src: v.carte_grise_verso,
                              },
                              {
                                label: "Attestation assurance",
                                src: v.attestation_assurance,
                              },
                              {
                                label: "Certificat visite",
                                src: v.certificat_visite,
                              },
                              {
                                label: "Photo intérieure",
                                src: v.photo_interieure,
                              },
                              {
                                label: "Photo extérieure",
                                src: v.photo_exterieure,
                              },
                              ...(v.licence_transport
                                ? [
                                    {
                                      label: "Licence transport",
                                      src: v.licence_transport,
                                    },
                                  ]
                                : []),
                            ].map(
                              (doc) =>
                                urlImage(doc.src) && (
                                  <button
                                    key={doc.label}
                                    onClick={() =>
                                      setImageAgrandie(urlImage(doc.src))
                                    }
                                    className="text-left"
                                  >
                                    <img
                                      src={urlImage(doc.src)}
                                      alt={doc.label}
                                      className="rounded-lg border w-full h-24 object-cover hover:opacity-80 transition"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">
                                      {doc.label}
                                    </p>
                                  </button>
                                ),
                            )}
                          </div>
                        </div>

                        {/* Motif rejet si existe */}
                        {v.motif_rejet && (
                          <p className="text-sm text-red-600">
                            Motif précédent : {v.motif_rejet}
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 items-center flex-wrap pt-2">
                          <button
                            onClick={() =>
                              changerStatutVehicule(v.id, "valide")
                            }
                            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700"
                          >
                            ✅ Valider ce véhicule
                          </button>
                          {rejetVehiculeOuvert === v.id ? (
                            <>
                              <input
                                value={motifRejetVehicule}
                                onChange={(e) =>
                                  setMotifRejetVehicule(e.target.value)
                                }
                                placeholder="Motif du rejet (obligatoire)"
                                className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px] bg-white"
                              />
                              <button
                                onClick={() =>
                                  changerStatutVehicule(v.id, "rejete")
                                }
                                disabled={!motifRejetVehicule.trim()}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                              >
                                Confirmer le rejet
                              </button>
                              <button
                                onClick={() => {
                                  setRejetVehiculeOuvert(null);
                                  setMotifRejetVehicule("");
                                }}
                                className="text-slate-500 text-sm"
                              >
                                Annuler
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setRejetVehiculeOuvert(v.id)}
                              className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-200"
                            >
                              ❌ Rejeter ce véhicule
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                  {/* ── Véhicule validé — bouton suspendre seulement ── */}
                  {v.statut_validation === "valide" && (
                    <div className="px-4 pb-3">
                      <button
                        onClick={() => changerStatutVehicule(v.id, "suspendu")}
                        className="bg-orange-100 text-orange-800 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-orange-200"
                      >
                        ⛔ Suspendre
                      </button>
                    </div>
                  )}

                  {/* ── Véhicule rejeté ── */}
                  {v.statut_validation === "rejete" && v.motif_rejet && (
                    <div className="px-4 pb-3">
                      <p className="text-sm text-red-600">
                        Motif : {v.motif_rejet}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── SECTION D+E+F — Trajets, revenus, passagers ── */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">🗺️ Trajets</h2>

        <div className="flex gap-2 mb-4 border-b">
          {ONGLETS_TRAJETS.map((o) => (
            <button
              key={o.cle}
              onClick={() => setOngletTrajets(o.cle)}
              className={`px-3 py-2 text-sm font-semibold border-b-2 transition ${
                ongletTrajets === o.cle
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        {trajetsFiltres.length === 0 ? (
          <p className="text-slate-500 text-sm py-6 text-center">
            Aucun trajet dans cette catégorie.
          </p>
        ) : (
          <div className="space-y-3">
            {trajetsFiltres.map((trajet) => {
              const reservations = reservationsParTrajet[trajet.id] || [];
              const confirmees = reservations.filter(
                (r) => r.statut === "confirmee",
              );
              const brut = confirmees.reduce(
                (s, r) => s + parseFloat(r.paiement?.montant_passager || 0),
                0,
              );
              const commission = confirmees.reduce(
                (s, r) => s + parseFloat(r.paiement?.commission_montant || 0),
                0,
              );
              const net = confirmees.reduce(
                (s, r) => s + parseFloat(r.paiement?.montant_conducteur || 0),
                0,
              );
              const dejaTransfere =
                confirmees.length > 0 &&
                confirmees.every((r) => r.paiement?.statut_escrow === "verse");

              return (
                <div
                  key={trajet.id}
                  className="border border-slate-100 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => basculerTrajet(trajet.id)}
                    className="w-full flex justify-between items-center px-4 py-3 hover:bg-slate-50 text-left"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">
                        {trajet.ville_depart} → {trajet.ville_arrivee}
                      </p>
                      <p className="text-sm text-slate-500">
                        📅 {trajet.date_depart} à {trajet.heure_depart} · 🚗
                        véhicule #{trajet.vehicule}
                      </p>
                    </div>
                    <span className="text-slate-400 text-sm">
                      {trajetOuvert === trajet.id ? "▲" : "▼"}
                    </span>
                  </button>

                  {trajetOuvert === trajet.id && (
                    <div className="border-t border-slate-100 p-4 space-y-4">
                      <p className="text-sm text-slate-500">
                        📏 {trajet.distance_km} km{" "}
                        {trajet.duree_estimee && `· ⏱️ ${trajet.duree_estimee}`}
                      </p>

                      {chargementReservations ? (
                        <p className="text-sm text-slate-500">
                          Chargement des réservations...
                        </p>
                      ) : (
                        <>
                          {/* SECTION E — Détail financier */}
                          <div className="bg-slate-50 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-3">
                              <h3 className="font-semibold text-slate-700 text-sm">
                                💰 Détail financier
                              </h3>
                              <span
                                className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                  dejaTransfere
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {dejaTransfere
                                  ? "✅ Revenu transféré"
                                  : "⏳ En attente de transfert"}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                              <div>
                                <p className="text-slate-400">
                                  Places remplies
                                </p>
                                <p className="font-semibold text-slate-800">
                                  {confirmees.length} /{" "}
                                  {trajet.sieges?.length || 0}
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-400">Montant brut</p>
                                <p className="font-semibold text-slate-800">
                                  {brut.toLocaleString()} Ar
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-400">
                                  Commission (10%)
                                </p>
                                <p className="font-semibold text-slate-800">
                                  {commission.toLocaleString()} Ar
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-400">Net conducteur</p>
                                <p className="font-semibold text-green-700">
                                  {net.toLocaleString()} Ar
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* SECTION F — Passagers */}
                          <div>
                            <h3 className="font-semibold text-slate-700 text-sm mb-2">
                              🧑‍🤝‍🧑 Passagers
                            </h3>
                            {reservations.length === 0 ? (
                              <p className="text-sm text-slate-400">
                                Aucune réservation sur ce trajet.
                              </p>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="text-left text-slate-400 border-b">
                                      <th className="py-2 pr-3">Nom</th>
                                      <th className="py-2 pr-3">Email</th>
                                      <th className="py-2 pr-3">Téléphone</th>
                                      <th className="py-2 pr-3">Montant</th>
                                      <th className="py-2">Statut</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {reservations.map((r) => {
                                      const badgeR =
                                        BADGES_RESERVATION[r.statut] ||
                                        BADGES_RESERVATION.confirmee;
                                      return (
                                        <tr
                                          key={r.id}
                                          className="border-b border-slate-50"
                                        >
                                          <td className="py-2 pr-3 font-medium text-slate-700">
                                            {r.passager_info?.prenom}{" "}
                                            {r.passager_info?.nom}
                                          </td>
                                          <td className="py-2 pr-3 text-slate-500">
                                            {r.passager_info?.email}
                                          </td>
                                          <td className="py-2 pr-3 text-slate-500">
                                            {r.passager_info?.telephone}
                                          </td>
                                          <td className="py-2 pr-3 text-slate-700">
                                            {parseFloat(
                                              r.prix_total,
                                            ).toLocaleString()}{" "}
                                            Ar
                                          </td>
                                          <td className="py-2">
                                            <span
                                              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeR.classe}`}
                                            >
                                              {badgeR.texte}
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── SECTION K — Historique des actions ── */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">
          📋 Historique des actions
        </h2>

        {historique.length === 0 ? (
          <p className="text-slate-500 text-sm">Aucune action enregistrée.</p>
        ) : (
          <div className="space-y-3">
            {historique.map((h) => {
              const style = ICONES_HISTORIQUE[h.action] || {
                icone: "📌",
                classe: "bg-slate-100 text-slate-800",
              };
              return (
                <div
                  key={h.id}
                  className="flex gap-3 items-start border-b border-slate-50 pb-3"
                >
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full mt-0.5 whitespace-nowrap ${style.classe}`}
                  >
                    {style.icone}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-slate-800">{h.description}</p>
                    <div className="flex gap-3 mt-1 flex-wrap">
                      <p className="text-xs text-slate-400">
                        🕐 {h.date_action}
                      </p>
                      <p className="text-xs text-slate-400">👤 {h.admin}</p>
                      {h.montant && (
                        <p className="text-xs font-semibold text-green-700">
                          💰 {parseFloat(h.montant).toLocaleString()} Ar
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Image agrandie au clic ── */}
      {imageAgrandie && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setImageAgrandie(null)}
        >
          <img
            src={imageAgrandie}
            alt="Document agrandi"
            className="max-h-[90vh] max-w-full rounded-lg"
          />
        </div>
      )}
    </AdminLayout>
  );
}
