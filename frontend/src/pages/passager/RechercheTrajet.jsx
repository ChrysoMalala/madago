import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import LayoutPassager from '../../components/LayoutPassager'
import Spinner from '../../components/Spinner'
import api from '../../api/axios'

export default function RechercheTrajet() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [trajets, setTrajets] = useState([])
  const [chargement, setChargement] = useState(false)
  const [rechercheLancee, setRechercheLancee] = useState(false)

  const [filtres, setFiltres] = useState({
    depart: searchParams.get('depart') || '',
    arrivee: searchParams.get('arrivee') || '',
    date: searchParams.get('date') || '',
  })

  const modifierFiltre = (e) => {
    setFiltres({ ...filtres, [e.target.name]: e.target.value })
  }

  const rechercher = async (e) => {
    if (e) e.preventDefault()
    setChargement(true)
    setRechercheLancee(true)

    try {
      const params = {}
      if (filtres.depart) params.depart = filtres.depart
      if (filtres.arrivee) params.arrivee = filtres.arrivee
      if (filtres.date) params.date = filtres.date

      setSearchParams(params)
      const res = await api.get('/trajets/', { params })
      setTrajets(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setChargement(false)
    }
  }

  // Lancer la recherche automatiquement si des paramètres existent
  useEffect(() => {
    if (filtres.depart || filtres.arrivee || filtres.date) {
      rechercher()
    }
  }, [])

  return (
    <LayoutPassager>
      <div className="max-w-4xl mx-auto">

        {/* Titre */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            🔍 Rechercher un trajet
          </h1>
          <p className="text-gray-500 mt-1">
            Trouvez le trajet qui vous convient
          </p>
        </div>

        {/* Formulaire de recherche */}
        <form onSubmit={rechercher}
          className="bg-white rounded-xl shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                🏙️ Ville de départ
              </label>
              <input
                name="depart"
                value={filtres.depart}
                onChange={modifierFiltre}
                placeholder="Antananarivo"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                🏙️ Ville d'arrivée
              </label>
              <input
                name="arrivee"
                value={filtres.arrivee}
                onChange={modifierFiltre}
                placeholder="Toamasina"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                📅 Date de départ
              </label>
              <input
                type="date"
                name="date"
                value={filtres.date}
                onChange={modifierFiltre}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={chargement}
            className="w-full bg-blue-700 text-white py-2 rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-50 transition">
            {chargement ? 'Recherche...' : '🔍 Rechercher'}
          </button>
        </form>

        {/* Résultats */}
        {chargement && <Spinner />}

        {!chargement && rechercheLancee && trajets.length === 0 && (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <p className="text-5xl mb-4">😕</p>
            <p className="text-gray-500 text-lg">
              Aucun trajet trouvé pour ces critères.
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Essayez avec d'autres villes ou une autre date.
            </p>
          </div>
        )}

        {!chargement && !rechercheLancee && (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <p className="text-5xl mb-4">🗺️</p>
            <p className="text-gray-500 text-lg">
              Entrez vos critères et lancez la recherche.
            </p>
          </div>
        )}

        {/* Liste des trajets */}
        <div className="space-y-4">
          {trajets.map((trajet) => {
            const siegesDisponibles = trajet.sieges?.filter(
              s => s.statut === 'disponible'
            ).length || 0

            return (
              <div key={trajet.id}
                className="bg-white rounded-xl shadow p-6 flex justify-between items-center hover:shadow-md transition">
                <div>
                  {/* Villes */}
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-gray-800 text-lg">
                      {trajet.ville_depart}
                    </span>
                    <span className="text-blue-700">→</span>
                    <span className="font-bold text-gray-800 text-lg">
                      {trajet.ville_arrivee}
                    </span>
                  </div>

                  {/* Infos */}
                  <p className="text-gray-500 text-sm">
                    📅 {trajet.date_depart} · ⏰ {trajet.heure_depart?.slice(0, 5)}
                    {trajet.duree_estimee && ` · ⏱️ ${trajet.duree_estimee}`}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    💺 {siegesDisponibles} place(s) disponible(s) ·
                    📍 {trajet.distance_km} km
                  </p>
                </div>

                {/* Prix + Bouton */}
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-700 mb-3">
                    {parseFloat(trajet.prix_unique || 0).toLocaleString()} Ar
                  </p>
                  <Link to={`/trajets/${trajet.id}`}
                    className="bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-800 transition">
                    Voir le trajet
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </LayoutPassager>
  )
}