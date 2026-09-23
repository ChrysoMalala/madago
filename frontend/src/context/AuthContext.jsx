import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import { traduire } from '../i18n'

const AuthContext = createContext()

// Clés localStorage utilisées UNIQUEMENT pour un visiteur non
// connecté (pas de compte disponible pour stocker la préférence côté
// serveur). Dès qu'un compte est chargé, ses préférences prennent
// le dessus.
const CLE_THEME_INVITE = 'preference_theme'
const CLE_LANGUE_INVITE = 'preference_langue'

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(null)
  const [profilConducteur, setProfilConducteur] = useState(null)
  const [chargement, setChargement] = useState(true)

  const [theme, setTheme] = useState(
    () => localStorage.getItem(CLE_THEME_INVITE) || 'clair'
  )
  const [langue, setLangue] = useState(
    () => localStorage.getItem(CLE_LANGUE_INVITE) || 'fr'
  )

  // ── Applique la classe .dark sur <html> à chaque changement ─────
  useEffect(() => {
    const racine = document.documentElement
    if (theme === 'sombre') {
      racine.classList.add('dark')
    } else {
      racine.classList.remove('dark')
    }
  }, [theme])

  useEffect(() => {
    const chargerUtilisateur = async () => {
      const token = localStorage.getItem('access_token')
      if (token) {
        try {
          const res = await api.get('/utilisateurs/moi/')
          setUtilisateur(res.data)

          // Les préférences du compte prennent le dessus sur celles
          // éventuellement définies en tant qu'invité.
          if (res.data.theme) setTheme(res.data.theme)
          if (res.data.langue) setLangue(res.data.langue)

          try {
            const resConducteur = await api.get('/conducteurs/moi/')
            setProfilConducteur(resConducteur.data)
          } catch {
            setProfilConducteur(null)
          }
        } catch {
          localStorage.removeItem('access_token')
        }
      }
      setChargement(false)
    }
    chargerUtilisateur()
  }, [])

  // ── Bascule du thème (instantanée, persistée selon le contexte) ─
  const basculerTheme = useCallback(async () => {
    const nouveauTheme = theme === 'clair' ? 'sombre' : 'clair'
    setTheme(nouveauTheme) // Changement immédiat à l'écran

    if (utilisateur) {
      // Compte connecté : on persiste sur le serveur. On ne bloque
      // pas l'interface en attendant la réponse (l'affichage a déjà
      // changé) ; en cas d'échec, la préférence reste appliquée
      // localement pour cette session, ce n'est pas bloquant.
      try {
        await api.put('/utilisateurs/mon-profil/', { theme: nouveauTheme })
      } catch (err) {
        console.error('Impossible de sauvegarder le thème sur le compte :', err)
      }
    } else {
      // Pas de compte : on garde la préférence dans le navigateur.
      localStorage.setItem(CLE_THEME_INVITE, nouveauTheme)
    }
  }, [theme, utilisateur])

  // ── Bascule de la langue (même logique) ──────────────────────────
  const basculerLangue = useCallback(async () => {
    const nouvelleLangue = langue === 'fr' ? 'mg' : 'fr'
    setLangue(nouvelleLangue)

    if (utilisateur) {
      try {
        await api.put('/utilisateurs/mon-profil/', { langue: nouvelleLangue })
      } catch (err) {
        console.error('Impossible de sauvegarder la langue sur le compte :', err)
      }
    } else {
      localStorage.setItem(CLE_LANGUE_INVITE, nouvelleLangue)
    }
  }, [langue, utilisateur])

  // Raccourci de traduction utilisable partout via useAuth().t('cle')
  const t = useCallback((cle) => traduire(cle, langue), [langue])

  const connexion = async (email, mot_de_passe) => {
    const res = await api.post('/auth/login/', { email, mot_de_passe })
    localStorage.setItem('access_token', res.data.tokens.access)
    localStorage.setItem('refresh_token', res.data.tokens.refresh)
    setUtilisateur(res.data.utilisateur)

    if (res.data.utilisateur.theme) setTheme(res.data.utilisateur.theme)
    if (res.data.utilisateur.langue) setLangue(res.data.utilisateur.langue)

    try {
      const resConducteur = await api.get('/conducteurs/moi/')
      setProfilConducteur(resConducteur.data)
    } catch {
      setProfilConducteur(null)
    }
    return res.data.utilisateur
  }

  const inscription = async (donnees) => {
    const res = await api.post('/auth/register/', donnees)
    localStorage.setItem('access_token', res.data.tokens.access)
    localStorage.setItem('refresh_token', res.data.tokens.refresh)
    setUtilisateur(res.data.utilisateur)
    setProfilConducteur(null)
    return res.data.utilisateur
  }

  const deconnexion = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUtilisateur(null)
    setProfilConducteur(null)
    // Le thème/langue restent appliqués tels quels après
    // déconnexion (redeviennent des préférences "invité").
  }

  return (
    <AuthContext.Provider value={{
      utilisateur, profilConducteur,
      setProfilConducteur, chargement,
      connexion, inscription, deconnexion,
      theme, langue, basculerTheme, basculerLangue, t,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)