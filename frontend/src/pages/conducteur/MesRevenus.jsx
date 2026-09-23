import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import LayoutConducteur from '../../components/LayoutConducteur'
import Spinner from '../../components/Spinner'
import api from '../../api/axios'

export default function MesRevenus() {
  const [trajets, setTrajets] = useState([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    const chargerTrajets = async () => {
      try {
        const res = await api.get('/trajets/mes-trajets/')
        setTrajets(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setChargement(false)
      }
    }
    chargerTrajets()
  }, [])

  if (chargement) return <Spinner />

  // Calculs des revenus
  const trajetsTermines = trajets.filter(t => t.statut === 'termine')
  const totalBrut = trajetsTermines.reduce((sum, t) =>
    sum + (parseFloat(t.prix_unique || 0) * (t.sieges?.filter(s => s.statut === 'reserve').length || 0)), 0)
  const totalCommission = totalBrut * 0.1
  const totalNet = totalBrut - totalCommission

  return (
    <LayoutConducteur>
      <div className="max-w-5xl mx-auto">

        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Mes revenus</h1>
          <p className="text-gray-500 mt-1">Statistiques de vos gains sur MadaGo</p>
        </div>

        {/* Cartes statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <p className="text-gray-500 text-sm mb-2">💰 Total brut</p>
            <p className="text-3xl font-bold text-gray-800">
              {totalBrut.toLocaleString()} Ar
            </p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <p className="text-gray-500 text-sm mb-2">📊 Commission MadaGo (10%)</p>
            <p className="text-3xl font-bold text-red-500">
              -{totalCommission.toLocaleString()} Ar
            </p>
          </div>
          <div className="bg-green-50 rounded-xl shadow p-6 text-center border border-green-200">
            <p className="text-gray-500 text-sm mb-2">✅ Revenus nets</p>
            <p className="text-3xl font-bold text-green-600">
              {totalNet.toLocaleString()} Ar
            </p>
          </div>
        </div>

        {/* Statistiques trajets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <p className="text-4xl font-bold text-blue-700">{trajets.length}</p>
            <p className="text-gray-500 mt-2">Trajets publiés au total</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <p className="text-4xl font-bold text-green-600">{trajetsTermines.length}</p>
            <p className="text-gray-500 mt-2">Trajets terminés</p>
          </div>
        </div>

        {/* Liste des trajets terminés */}
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Historique des trajets terminés
        </h2>

        {trajetsTermines.length === 0 && (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <p className="text-5xl mb-4">💰</p>
            <p className="text-gray-500 text-lg mb-4">
              Aucun trajet terminé pour le moment.
            </p>
            <Link to="/conducteur/trajets/publier"
              className="bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-800">
              Publier un trajet
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {trajetsTermines.map((trajet) => {
            const siegesReserves = trajet.sieges?.filter(s => s.statut === 'reserve').length || 0
            const revenuBrut = parseFloat(trajet.prix_unique || 0) * siegesReserves
            const revenuNet = revenuBrut * 0.9

            return (
              <div key={trajet.id}
                className="bg-white rounded-xl shadow p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {trajet.ville_depart} → {trajet.ville_arrivee}
                    </h3>
                    <p className="text-gray-500 text-sm mt-1">
                      📅 {trajet.date_depart} · 🎫 {siegesReserves} siège(s) vendu(s)
                    </p>
                    <p className="text-gray-500 text-sm">
                      💵 {parseFloat(trajet.prix_unique || 0).toLocaleString()} Ar/siège
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Revenu net</p>
                    <p className="text-2xl font-bold text-green-600">
                      {revenuNet.toLocaleString()} Ar
                    </p>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      ✅ Terminé
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </LayoutConducteur>
  )
}