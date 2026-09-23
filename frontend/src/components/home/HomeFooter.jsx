import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function HomeFooter() {
  const { utilisateur, deconnexion } = useAuth();

  // =====================================================
  // LIEN DEVENIR CONDUCTEUR
  // =====================================================

  const lienConducteur = () => {
    if (!utilisateur) {
      return "/connexion?redirect=conducteur";
    }

    if (utilisateur.est_conducteur) {
      return "/conducteur";
    }

    return "/conducteur/inscription";
  };

  return (
    <footer
      id="contact"
      className="
        bg-[#062A25]
        text-white
        pt-16
        pb-8
      "
    >
      <div
        className="
          max-w-7xl
          mx-auto
          px-6
          grid
          md:grid-cols-4
          gap-10
        "
      >
        {/* Présentation */}

        <div>
          <h3
            className="
              text-2xl
              font-bold
              mb-5
            "
          >
            🚗 MadaGo
          </h3>

          <p
            className="
              text-white/70
              leading-relaxed
              text-sm
            "
          >
            La plateforme malgache qui connecte voyageurs et conducteurs pour
            des déplacements interurbains simples, sécurisés et transparents.
          </p>
        </div>

        {/* Navigation */}

        <div>
          <h4
            className="
              font-bold
              mb-5
            "
          >
            Navigation
          </h4>

          <ul
            className="
              space-y-3
              text-sm
              text-white/70
            "
          >
            <li>
              <Link to="/" className="hover:text-white transition">
                Accueil
              </Link>
            </li>

            <li>
              <a href="#pourquoi" className="hover:text-white transition">
                Pourquoi MadaGo ?
              </a>
            </li>

            <li>
              <a href="#securite" className="hover:text-white transition">
                Sécurité
              </a>
            </li>

            <li>
              <a href="#paiement" className="hover:text-white transition">
                Paiement
              </a>
            </li>
          </ul>
        </div>

        {/* Services */}

        <div>
          <h4
            className="
              font-bold
              mb-5
            "
          >
            Services
          </h4>

          <ul
            className="
              space-y-3
              text-sm
              text-white/70
            "
          >
            <li>
              <Link to="/trajets" className="hover:text-white transition">
                Rechercher un trajet
              </Link>
            </li>

            <li>
              <Link
                to={lienConducteur()}
                className="hover:text-white transition"
              >
                Devenir conducteur
              </Link>
            </li>

            {/* Liens futurs */}

            <li>
              <a href="#" className="hover:text-white transition">
                Centre d'aide
              </a>
            </li>

            <li>
              <a href="#" className="hover:text-white transition">
                Application mobile
              </a>
            </li>
          </ul>
        </div>

        {/* Contact + compte */}

        <div>
          <h4
            className="
              font-bold
              mb-5
            "
          >
            Contact
          </h4>

          <div
            className="
              space-y-3
              text-sm
              text-white/70
            "
          >
            <p>📍 Madagascar</p>

            <p>📧 contact@madago.mg</p>

            <p>📞 +261 XX XX XXX XX</p>
          </div>

          <div
            className="
              mt-6
              space-y-3
              text-sm
            "
          >
            {!utilisateur ? (
              <>
                {/* Connexion normale */}

                <Link
                  to="/connexion"
                  className="
                    block
                    text-[#23C483]
                    hover:text-white
                  "
                >
                  Connexion
                </Link>

                {/* Inscription normale */}

                <Link
                  to="/inscription"
                  className="
                    block
                    text-[#23C483]
                    hover:text-white
                  "
                >
                  Inscription
                </Link>
              </>
            ) : (
              <button
                onClick={deconnexion}
                className="
                  text-[#23C483]
                  hover:text-white
                "
              >
                Déconnexion
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Ligne finale */}

      <div
        className="
          max-w-7xl
          mx-auto
          px-6
          mt-12
          pt-6
          border-t
          border-white/10
          text-center
          text-sm
          text-white/50
        "
      >
        © 2026 MadaGo — Projet de mémoire Master 2 Génie Logiciel
      </div>
    </footer>
  );
}
