import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import LayoutConducteur from "../../components/LayoutConducteur"
import Spinner from "../../components/Spinner"
import MessageErreur from "../../components/MessageErreur"
import api from "../../api/axios"

const ONGLETS = [
  { cle: "a_venir", label: "À venir" },
  { cle: "en_cours", label: "En cours" },
  { cle: "termine", label: "Terminé" },
  { cle: "tous", label: "Tous" },
]

const BADGES = {
  a_venir: {
    texte: "🔵 À venir",
    classe: "bg-blue-100 text-blue-800",
  },
  en_cours: {
    texte: "🟢 En cours",
    classe: "bg-green-100 text-green-800",
  },
  termine: {
    texte: "⚪ Terminé",
    classe: "bg-gray-100 text-gray-800",
  },
  annule: {
    texte: "🔴 Annulé",
    classe: "bg-red-100 text-red-800",
  },
}

export default function MesTrajets() {
  const navigate = useNavigate()

  const [ongletActif, setOngletActif] = useState("a_venir")
  const [trajets, setTrajets] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState("")
  const [messageAction, setMessageAction] = useState("")

  const chargerTrajets = async () => {
    setChargement(true)
    setErreur("")

    try {
      const params =
        ongletActif === "tous"
          ? {}
          : { statut: ongletActif }

      const reponse = await api.get("/trajets/mes-trajets/", {
        params,
      })

      setTrajets(reponse.data)
    } catch (err) {
      console.error(err)
      setErreur("Impossible de charger vos trajets.")
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => {
    chargerTrajets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ongletActif])

  const placesRestantes = (trajet) => {
    if (!trajet.sieges || trajet.sieges.length === 0) {
      return null
    }

    const disponibles = trajet.sieges.filter(
      (s) => s.statut === "disponible"
    ).length

    return `${disponibles}/${trajet.sieges.length} places disponibles`
  }

  const supprimerTrajet = async (trajetId) => {
    if (!window.confirm("Supprimer ce trajet ?")) {
      return
    }

    try {
      await api.delete(`/trajets/${trajetId}/supprimer/`)

      setMessageAction("✅ Trajet supprimé avec succès.")

      chargerTrajets()
    } catch (err) {
      console.error(err)

      setErreur(
        err.response?.data?.erreur ||
          "Impossible de supprimer ce trajet."
      )
    }
  }

  return (
    <LayoutConducteur>
      <div className="p-6">

        {/* ─────────────────────────────────────────
            EN-TÊTE
        ────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Mes Trajets
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Gérez vos trajets publiés et leurs réservations.
            </p>
          </div>

          {/* ── Publier un trajet ── */}
          <Link
            to="/conducteur/trajets/publier"
            className="bg-blue-700 text-white rounded-xl p-4 md:p-5 hover:bg-blue-800 transition flex items-center gap-3 shadow-sm"
          >
            <span className="text-2xl">🗺️</span>

            <div>
              <p className="font-semibold text-lg">
                Publier un trajet
              </p>

              <p className="text-blue-200 text-sm mt-1">
                Créer un nouveau trajet
              </p>
            </div>
          </Link>
        </div>

        {/* ─────────────────────────────────────────
            ONGLET
        ────────────────────────────────────────── */}
        <div className="flex gap-2 mb-6 border-b overflow-x-auto">
          {ONGLETS.map((onglet) => (
            <button
              key={onglet.cle}
              onClick={() => setOngletActif(onglet.cle)}
              className={`px-4 py-2 font-semibold border-b-2 transition whitespace-nowrap ${
                ongletActif === onglet.cle
                  ? "border-blue-700 text-blue-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {onglet.label}
            </button>
          ))}
        </div>

        {/* ─────────────────────────────────────────
            MESSAGE ERREUR
        ────────────────────────────────────────── */}
        {erreur && (
          <MessageErreur message={erreur} />
        )}

        {/* ─────────────────────────────────────────
            MESSAGE ACTION
        ────────────────────────────────────────── */}
        {messageAction && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg px-4 py-3 mb-4 text-sm">
            {messageAction}
          </div>
        )}

        {/* ─────────────────────────────────────────
            CHARGEMENT
        ────────────────────────────────────────── */}
        {chargement ? (
          <Spinner />
        ) : trajets.length === 0 ? (
          /* ───────────────────────────────────────
             AUCUN TRAJET
          ──────────────────────────────────────── */
          <div className="text-center py-16 text-gray-500 bg-white rounded-xl shadow-sm">
            <p className="text-4xl mb-3">
              🗺️
            </p>

            <p className="mb-4">
              Aucun trajet dans cette catégorie.
            </p>

            {ongletActif === "a_venir" && (
              <Link
                to="/conducteur/trajets/publier"
                className="inline-block bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-800 transition"
              >
                🗺️ Publier mon premier trajet
              </Link>
            )}
          </div>
        ) : (
          /* ───────────────────────────────────────
             LISTE DES TRAJETS
          ──────────────────────────────────────── */
          <div className="space-y-4">
            {trajets.map((trajet) => {
              const badge =
                BADGES[trajet.statut] ||
                BADGES.a_venir

              const aDesReservations =
                trajet.sieges?.some(
                  (s) => s.statut === "reserve"
                )

              return (
                <div
                  key={trajet.id}
                  className="bg-white rounded-xl shadow p-5"
                >
                  {/* ── En-tête du trajet ── */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                    <h3 className="text-lg font-bold text-gray-800">
                      {trajet.ville_depart} →{" "}
                      {trajet.ville_arrivee}
                    </h3>

                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${badge.classe}`}
                    >
                      {badge.texte}
                    </span>
                  </div>

                  {/* ── Informations ── */}
                  <p className="text-sm text-gray-500 mb-1">
                    📅 {trajet.date_depart} à{" "}
                    {trajet.heure_depart?.slice(0, 5)}
                    {" · "}
                    📏 {trajet.distance_km} km
                  </p>

                  <p className="text-sm text-gray-500 mb-1">
                    💰{" "}
                    {trajet.prix_unique
                      ? `${parseFloat(
                          trajet.prix_unique
                        ).toLocaleString()} Ar`
                      : "Tarif par destination"}
                  </p>

                  {placesRestantes(trajet) && (
                    <p className="text-sm text-gray-500 mb-3">
                      🪑 {placesRestantes(trajet)}
                    </p>
                  )}

                  {/* ── Actions ── */}
                  <div className="flex flex-wrap gap-2 mt-3">

                    {/* Voir les détails — toujours visible */}
                    <button
                      onClick={() =>
                        navigate(
                          `/conducteur/trajets/${trajet.id}`
                        )
                      }
                      className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 transition"
                    >
                      👁️ Voir les détails
                    </button>

                    {/* Modifier — uniquement si à venir et sans réservation */}
                    {trajet.statut === "a_venir" &&
                      !aDesReservations && (
                        <button
                          onClick={() =>
                            navigate(
                              `/conducteur/trajets/${trajet.id}/modifier`
                            )
                          }
                          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition"
                        >
                          ✏️ Modifier
                        </button>
                      )}

                    {/* Supprimer — uniquement si à venir et sans réservation */}
                    {trajet.statut === "a_venir" &&
                      !aDesReservations && (
                        <button
                          onClick={() =>
                            supprimerTrajet(trajet.id)
                          }
                          className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-100 transition"
                        >
                          🗑️ Supprimer
                        </button>
                      )}

                    {/* Trajet verrouillé */}
                    {trajet.statut === "a_venir" &&
                      aDesReservations && (
                        <span className="text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                          🔒 Trajet verrouillé — réservations en cours
                        </span>
                      )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </LayoutConducteur>
  )
}