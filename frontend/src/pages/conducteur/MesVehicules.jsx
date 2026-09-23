import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import LayoutConducteur from '../../components/LayoutConducteur'
import Spinner from '../../components/Spinner'
import api from '../../api/axios'

export default function MesVehicules() {
  const [vehicules, setVehicules] = useState([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    const chargerVehicules = async () => {
      try {
        const res = await api.get('/vehicules/')
        setVehicules(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setChargement(false)
      }
    }
    chargerVehicules()
  }, [])

  const supprimerVehicule = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce véhicule ?')) return
    try {
      await api.delete(`/vehicules/${id}/`)
      setVehicules(vehicules.filter(v => v.id !== id))
    } catch {
      alert('Impossible de supprimer ce véhicule.')
    }
  }

  const couleurStatut = {
    'en_attente': 'bg-yellow-100 text-yellow-800',
    'valide': 'bg-green-100 text-green-800',
    'suspendu': 'bg-orange-100 text-orange-800',
    'rejete': 'bg-red-100 text-red-800',
    'expire': 'bg-red-100 text-red-800',
  }

  const libelleStatut = {
    'en_attente': '⏳ En attente',
    'valide': '✅ Validé',
    'suspendu': '⚠️ Suspendu',
    'rejete': '❌ Rejeté',
    'expire': '🚫 Expiré',
  }

  if (chargement) return <Spinner />

  return (
    <LayoutConducteur>
      <div className="max-w-5xl mx-auto">
        {/* En-tête */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Mes véhicules</h1>
            <p className="text-gray-500 mt-1">{vehicules.length} véhicule(s) enregistré(s)</p>
          </div>
          <Link to="/conducteur/vehicules/ajouter"
            className="bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-800 transition">
            + Ajouter un véhicule
          </Link>
        </div>

        {/* Liste vide */}
        {vehicules.length === 0 && (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <p className="text-5xl mb-4">🚗</p>
            <p className="text-gray-500 text-lg mb-6">
              Vous n'avez pas encore de véhicule enregistré.
            </p>
            <Link to="/conducteur/vehicules/ajouter"
              className="bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-800">
              Ajouter mon premier véhicule
            </Link>
          </div>
        )}

        {/* Liste des véhicules */}
        <div className="space-y-4">
          {vehicules.map((vehicule) => (
            <div key={vehicule.id}
              className="bg-white rounded-xl shadow p-6 flex justify-between items-center">

              {/* Infos véhicule */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold text-gray-800">
                    {vehicule.marque} {vehicule.modele}
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${couleurStatut[vehicule.statut_validation]}`}>
                    {libelleStatut[vehicule.statut_validation]}
                  </span>
                </div>
                <p className="text-gray-500 text-sm">
                  🚘 {vehicule.type_vehicule} · {vehicule.annee} · {vehicule.couleur}
                </p>
                <p className="text-gray-500 text-sm">
                  🪪 {vehicule.immatriculation} · {vehicule.nombre_places} places · {vehicule.type_carburant}
                </p>
                {vehicule.statut_validation === 'rejete' && vehicule.motif_rejet && (
                  <p className="text-red-600 text-xs mt-1">
                    Motif du rejet : {vehicule.motif_rejet}
                  </p>
                )}
                {vehicule.statut_validation === 'expire' && vehicule.motif_rejet && (
                  <p className="text-red-600 text-xs mt-1">
                    {vehicule.motif_rejet}
                  </p>
                )}

                {/* Badges d'alerte (assurance / visite bientôt ou
                    déjà expirées) — calculés côté backend, affichés
                    même si le véhicule est encore "valide" pour
                    prévenir le conducteur en amont. */}
                {vehicule.alertes_vehicule?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {vehicule.alertes_vehicule.map((alerte) => (
                      <span
                        key={alerte.type}
                        className={`px-2 py-1 rounded-full text-xs font-medium ${alerte.classe}`}
                      >
                        {alerte.icone} {alerte.texte}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Link
                  to={`/conducteur/vehicules/${vehicule.id}/modifier`}
                  className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-200 transition">
                  ✏️ Modifier
                </Link>
                <button
                  onClick={() => supprimerVehicule(vehicule.id)}
                  className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200 transition">
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </LayoutConducteur>
  )
}