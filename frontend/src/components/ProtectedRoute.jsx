import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// role="conducteur" => nécessite la capacité conducteur VALIDÉE (utilisateur.est_conducteur)
// role absent ou autre => nécessite simplement d'être connecté (tout compte est passager)
export default function ProtectedRoute({ children, role }) {
  const { utilisateur, chargement } = useAuth()
  const location = useLocation()

  if (chargement) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Chargement...</p>
      </div>
    )
  }

  if (!utilisateur) {
    // On mémorise la page demandée pour y renvoyer l'utilisateur après connexion
    return <Navigate to="/connexion" state={{ from: location.pathname }} replace />
  }

  if (role === 'conducteur' && !utilisateur.est_conducteur) {
    return <Navigate to="/passager" replace />
  }

  return children
}