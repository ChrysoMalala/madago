import { Navigate } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'

// Protège les routes /admin/* en utilisant EXCLUSIVEMENT AdminAuthContext.
// N'a aucune dépendance envers AuthContext ou ProtectedRoute.
export default function AdminRoute({ children }) {
  const { admin, chargement } = useAdminAuth()

  if (chargement) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <p className="text-slate-300 text-lg">Chargement...</p>
      </div>
    )
  }

  if (!admin || !admin.is_staff) return <Navigate to="/admin-login" replace />

  return children
}