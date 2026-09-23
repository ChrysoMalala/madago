import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LayoutPassager from '../../components/LayoutPassager'
import Spinner from '../../components/Spinner'
import api from '../../api/axios'

export default function TableauBordPassager() {
  const { utilisateur } = useAuth()
  const [reservations, setReservations] = useState([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    const chargerReservations = async () => {
      try {
        const res = await api.get('/reservations/mes-reservations/')
        setReservations(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setChargement(false)
      }
    }
    chargerReservations()
  }, [])

  if (chargement) return <Spinner />

  const reservationsConfirmees = reservations.filter(r => r.statut === 'confirmee')
  const dernieresReservations = reservations.slice(0, 3)

  const couleurStatut = {
    'confirmee': 'bg-green-100 text-green-800',
    'annulee': 'bg-red-100 text-red-800',
    'remboursee': 'bg-gray-100 text-gray-800',
  }

  const libelleStatut = {
    'confirmee': '✅ Confirmée',
    'annulee': '❌ Annulée',
    'remboursee': '💸 Remboursée',
  }

  return (
    <LayoutPassager>
      <div className="max-w-4xl mx-auto">

        {/* Titre */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Bonjour, {utilisateur?.prenom} 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Bienvenue sur votre espace passager
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <p className="text-4xl font-bold text-blue-700">
              {reservations.length}
            </p>
            <p className="text-gray-500 mt-2">Réservations au total</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <p className="text-4xl font-bold text-green-600">
              {reservationsConfirmees.length}
            </p>
            <p className="text-gray-500 mt-2">Réservations confirmées</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <p className="text-4xl font-bold text-orange-500">
              {reservations.filter(r => r.statut === 'annulee').length}
            </p>
            <p className="text-gray-500 mt-2">Réservations annulées</p>
          </div>
        </div>

        {/* Action rapide */}
        <div className="bg-blue-700 rounded-xl p-6 mb-8 flex justify-between items-center">
          <div>
            <p className="text-white font-bold text-xl">
              🔍 Trouver un trajet
            </p>
            <p className="text-blue-200 text-sm mt-1">
              Recherchez parmi les trajets disponibles
            </p>
          </div>
          <Link to="/passager/recherche"
            className="bg-white text-blue-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100">
            Rechercher
          </Link>
        </div>

        {/* Dernières réservations */}
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Dernières réservations
        </h2>

        {dernieresReservations.length === 0 && (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <p className="text-5xl mb-4">🎫</p>
            <p className="text-gray-500 text-lg mb-4">
              Vous n'avez pas encore de réservation.
            </p>
            <Link to="/passager/recherche"
              className="bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-800">
              Rechercher un trajet
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {dernieresReservations.map((reservation) => (
            <div key={reservation.id}
              className="bg-white rounded-xl shadow p-6 flex justify-between items-center">
              <div>
                <p className="font-bold text-gray-800">
                  Réservation #{reservation.id}
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  💺 Siège {reservation.siege} ·
                  💰 {parseFloat(reservation.prix_total).toLocaleString()} Ar
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  {new Date(reservation.date_reservation).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${couleurStatut[reservation.statut]}`}>
                {libelleStatut[reservation.statut]}
              </span>
            </div>
          ))}
        </div>

        {reservations.length > 3 && (
          <div className="text-center mt-6">
            <Link to="/passager/reservations"
              className="text-blue-700 font-medium hover:underline">
              Voir toutes mes réservations →
            </Link>
          </div>
        )}
      </div>
    </LayoutPassager>
  )
}