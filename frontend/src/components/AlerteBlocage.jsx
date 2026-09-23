import { Link } from 'react-router-dom'

// Composant réutilisable pour bloquer l'accès à une fonctionnalité
// tant qu'une condition métier n'est pas remplie (profil non validé,
// aucun véhicule enregistré, etc.)
export default function AlerteBlocage({ icone = '🔒', titre, message, lienAction }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md text-center">
        <p className="text-4xl mb-4">{icone}</p>
        <h2 className="text-xl font-bold text-gray-800 mb-2">{titre}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        {lienAction && (
          <Link
            to={lienAction.to}
            className="inline-block bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-800 mb-3"
          >
            {lienAction.label}
          </Link>
        )}
        <Link to="/conducteur" className="block text-sm text-gray-500 underline mt-2">
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  )
}