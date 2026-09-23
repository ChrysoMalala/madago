import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

import api from "../api/axios";
import { traduire } from "../i18n";

const AuthContext = createContext();

// Clés localStorage utilisées UNIQUEMENT pour un visiteur non
// connecté (pas de compte disponible pour stocker la préférence côté
// serveur). Dès qu'un compte est chargé, ses préférences prennent
// le dessus.

const CLE_THEME_INVITE = "preference_theme";
const CLE_LANGUE_INVITE = "preference_langue";

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(null);

  const [profilConducteur, setProfilConducteur] = useState(null);

  const [chargement, setChargement] = useState(true);

  const [theme, setTheme] = useState(
    () => localStorage.getItem(CLE_THEME_INVITE) || "clair",
  );

  const [langue, setLangue] = useState(
    () => localStorage.getItem(CLE_LANGUE_INVITE) || "fr",
  );

  // =====================================================
  // THÈME
  // =====================================================

  useEffect(() => {
    const racine = document.documentElement;

    if (theme === "sombre") {
      racine.classList.add("dark");
    } else {
      racine.classList.remove("dark");
    }
  }, [theme]);

  // =====================================================
  // CHARGEMENT UTILISATEUR
  // =====================================================

  useEffect(() => {
    const chargerUtilisateur = async () => {
      const token = localStorage.getItem("access_token");

      if (token) {
        try {
          const res = await api.get("/utilisateurs/moi/");

          setUtilisateur(res.data);

          // Les préférences du compte prennent
          // le dessus sur celles de l'invité.

          if (res.data.theme) {
            setTheme(res.data.theme);
          }

          if (res.data.langue) {
            setLangue(res.data.langue);
          }

          // -------------------------------------
          // Profil conducteur
          // -------------------------------------

          try {
            const resConducteur = await api.get("/conducteurs/moi/");

            setProfilConducteur(resConducteur.data);
          } catch {
            setProfilConducteur(null);
          }
        } catch {
          localStorage.removeItem("access_token");

          localStorage.removeItem("refresh_token");

          setUtilisateur(null);
          setProfilConducteur(null);
        }
      }

      setChargement(false);
    };

    chargerUtilisateur();
  }, []);

  // =====================================================
  // BASCULER THÈME
  // =====================================================

  const basculerTheme = useCallback(async () => {
    const nouveauTheme = theme === "clair" ? "sombre" : "clair";

    // Changement immédiat à l'écran

    setTheme(nouveauTheme);

    if (utilisateur) {
      try {
        const res = await api.put("/utilisateurs/moi/", {
          theme: nouveauTheme,
        });

        // On synchronise également l'utilisateur
        // contenu dans le contexte.

        if (res.data?.utilisateur) {
          setUtilisateur(res.data.utilisateur);
        }
      } catch (err) {
        console.error(
          "Impossible de sauvegarder le thème sur le compte :",
          err,
        );
      }
    } else {
      localStorage.setItem(CLE_THEME_INVITE, nouveauTheme);
    }
  }, [theme, utilisateur]);

  // =====================================================
  // BASCULER LANGUE
  // =====================================================

  const basculerLangue = useCallback(async () => {
    const nouvelleLangue = langue === "fr" ? "mg" : "fr";

    setLangue(nouvelleLangue);

    if (utilisateur) {
      try {
        const res = await api.put("/utilisateurs/moi/", {
          langue: nouvelleLangue,
        });

        if (res.data?.utilisateur) {
          setUtilisateur(res.data.utilisateur);
        }
      } catch (err) {
        console.error(
          "Impossible de sauvegarder la langue sur le compte :",
          err,
        );
      }
    } else {
      localStorage.setItem(CLE_LANGUE_INVITE, nouvelleLangue);
    }
  }, [langue, utilisateur]);

  // =====================================================
  // TRADUCTION
  // =====================================================

  const t = useCallback((cle) => traduire(cle, langue), [langue]);

  // =====================================================
  // CONNEXION
  // =====================================================

  const connexion = async (email, mot_de_passe) => {
    const res = await api.post("/auth/login/", {
      email,
      mot_de_passe,
    });

    localStorage.setItem("access_token", res.data.tokens.access);

    localStorage.setItem("refresh_token", res.data.tokens.refresh);

    setUtilisateur(res.data.utilisateur);

    if (res.data.utilisateur.theme) {
      setTheme(res.data.utilisateur.theme);
    }

    if (res.data.utilisateur.langue) {
      setLangue(res.data.utilisateur.langue);
    }

    try {
      const resConducteur = await api.get("/conducteurs/moi/");

      setProfilConducteur(resConducteur.data);
    } catch {
      setProfilConducteur(null);
    }

    return res.data.utilisateur;
  };

  // =====================================================
  // INSCRIPTION
  // =====================================================

  const inscription = async (donnees) => {
    const res = await api.post("/auth/register/", donnees);

    localStorage.setItem("access_token", res.data.tokens.access);

    localStorage.setItem("refresh_token", res.data.tokens.refresh);

    setUtilisateur(res.data.utilisateur);

    setProfilConducteur(null);

    if (res.data.utilisateur.theme) {
      setTheme(res.data.utilisateur.theme);
    }

    if (res.data.utilisateur.langue) {
      setLangue(res.data.utilisateur.langue);
    }

    return res.data.utilisateur;
  };

  // =====================================================
  // METTRE À JOUR L'UTILISATEUR
  // =====================================================
  //
  // Cette fonction sera utilisée après :
  // - modification du profil
  // - ajout d'une PDP
  // - changement de PDP
  //
  // Cela permet à Navbar, profil passager et profil
  // conducteur d'être actualisés immédiatement.
  // =====================================================

  const mettreAJourUtilisateur = useCallback((nouvelUtilisateur) => {
    if (!nouvelUtilisateur) {
      return;
    }

    setUtilisateur(nouvelUtilisateur);

    if (nouvelUtilisateur.theme) {
      setTheme(nouvelUtilisateur.theme);
    }

    if (nouvelUtilisateur.langue) {
      setLangue(nouvelUtilisateur.langue);
    }
  }, []);

  // =====================================================
  // DÉCONNEXION
  // =====================================================

  const deconnexion = () => {
    localStorage.removeItem("access_token");

    localStorage.removeItem("refresh_token");

    setUtilisateur(null);

    setProfilConducteur(null);

    // Le thème/langue restent appliqués tels quels
    // après déconnexion.
  };

  // =====================================================
  // CONTEXTE
  // =====================================================

  return (
    <AuthContext.Provider
      value={{
        utilisateur,

        // Permet aux composants profil de mettre
        // immédiatement à jour la PDP.
        setUtilisateur,

        mettreAJourUtilisateur,

        profilConducteur,
        setProfilConducteur,

        chargement,

        connexion,
        inscription,
        deconnexion,

        theme,
        langue,

        basculerTheme,
        basculerLangue,

        t,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
