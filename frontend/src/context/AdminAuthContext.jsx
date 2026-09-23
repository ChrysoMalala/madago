import { createContext, useContext, useState, useEffect } from 'react'
import adminApi from '../api/adminAxios'

// Contexte d'authentification 100% indépendant de AuthContext.jsx.
// Gère sa propre session (clés localStorage préfixées admin_) et vérifie
// systématiquement is_staff : un token valide mais non-admin est refusé.
const AdminAuthContext = createContext()

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    const chargerAdmin = async () => {
      const token = localStorage.getItem('admin_access_token')
      if (token) {
        try {
          const res = await adminApi.get('/utilisateurs/moi/')
          if (res.data.is_staff) {
            setAdmin(res.data)
          } else {
            localStorage.removeItem('admin_access_token')
            localStorage.removeItem('admin_refresh_token')
          }
        } catch {
          localStorage.removeItem('admin_access_token')
          localStorage.removeItem('admin_refresh_token')
        }
      }
      setChargement(false)
    }
    chargerAdmin()
  }, [])

  const adminConnexion = async (email, mot_de_passe) => {
    const res = await adminApi.post('/auth/login/', { email, mot_de_passe })
    if (!res.data.utilisateur.is_staff) {
      throw new Error("Ce compte n'a pas les droits d'administration.")
    }
    localStorage.setItem('admin_access_token', res.data.tokens.access)
    localStorage.setItem('admin_refresh_token', res.data.tokens.refresh)
    setAdmin(res.data.utilisateur)
    return res.data.utilisateur
  }

  const adminDeconnexion = () => {
    localStorage.removeItem('admin_access_token')
    localStorage.removeItem('admin_refresh_token')
    setAdmin(null)
  }

  return (
    <AdminAuthContext.Provider value={{ admin, chargement, adminConnexion, adminDeconnexion }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAdminAuth = () => useContext(AdminAuthContext)