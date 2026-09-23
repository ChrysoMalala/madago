import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import MessageErreur from "../../components/MessageErreur";
import loginBg from "../../assets/images/login-bg.jpg";
import logoMadaGo from "../../assets/images/logo-madago.png";

export default function Connexion() {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");

  const [afficherMotDePasse, setAfficherMotDePasse] = useState(false);

  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  const { connexion } = useAuth();

  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const redirect = searchParams.get("redirect");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErreur("");

    setChargement(true);

    try {
      const utilisateur = await connexion(email, motDePasse);

      // Cas demande conducteur

      if (redirect === "conducteur") {
        navigate("/conducteur/inscription");

        return;
      }

      // Redirection selon rôle

      if (utilisateur.role === "conducteur") {
        navigate("/conducteur");
      } else {
        navigate("/passager");
      }
    } catch {
      setErreur("Email ou mot de passe incorrect");
    } finally {
      setChargement(false);
    }
  };

  return (
    <div
      className="
      min-h-screen
      flex
      bg-gray-50
      "
    >
      {/* =========================
          PARTIE GAUCHE IMAGE
      ========================== */}

      <div
        className="
        hidden
        md:flex
        w-1/2
        relative
        bg-cover
        bg-center
        "
        style={{
          backgroundImage: `
          linear-gradient(
            rgba(6,42,37,0.78),
            rgba(6,42,37,0.78)
          ),
          url(${loginBg})
          `,
        }}
      >
        <div
          className="
          relative
          z-10
          flex
          flex-col
          justify-center
          px-12
          text-white
          max-w-xl
          "
        >
          <h1
            className="
            text-5xl
            font-bold
            leading-tight
            mb-6
            "
          >
            Voyagez en toute confiance avec MadaGo
          </h1>

          <p
            className="
            text-lg
            text-gray-200
            leading-relaxed
            "
          >
            Votre plateforme de transport simple, sécurisée et accessible
            partout à Madagascar.
          </p>

          <div
            className="
            mt-10
            space-y-4
            text-lg
            "
          >
            <p>🔐 Connexion sécurisée</p>

            <p>✓ Conducteurs vérifiés</p>

            <p>✓ Réservation rapide et facile</p>

            <p>✓ Paiements pratiques</p>
          </div>
        </div>
      </div>

      {/* =========================
          FORMULAIRE DROIT
      ========================== */}

      <div
        className="
        w-full
        md:w-1/2
        flex
        items-center
        justify-center
        px-6
        py-10
        "
      >
        <div
          className="
          w-full
          max-w-md
          bg-white
          rounded-3xl
          shadow-xl
          border
          border-gray-100
          p-8
          "
        >
          {/* Logo */}

          <div
            className="
            text-center
            mb-8
            "
          >
            <img
              src={logoMadaGo}
              alt="MadaGo"
              className="
              h-20
              w-auto
              mx-auto
              object-contain
              "
            />

            <p
              className="
              mt-3
              text-gray-500
              "
            >
              {redirect === "conducteur"
                ? "Connectez-vous pour devenir conducteur"
                : "Bienvenue sur MadaGo"}
            </p>
          </div>

          {/* Message erreur */}

          <MessageErreur message={erreur} />

          {/* Message conducteur */}

          {redirect === "conducteur" && (
            <div
              className="
              mb-5
              bg-green-50
              border
              border-green-200
              rounded-xl
              p-4
              text-sm
              text-green-800
              "
            >
              🚗 Après connexion, vous pourrez continuer votre inscription
              conducteur.
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="
            space-y-5
            "
          >
            {/* Email */}

            <div>
              <label
                className="
                block
                mb-2
                text-sm
                font-semibold
                text-[#062A25]
                "
              >
                📧 Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                className="
                w-full
                px-4
                py-3
                rounded-xl
                border
                border-gray-200
                focus:ring-2
                focus:ring-[#23C483]
                outline-none
                "
              />
            </div>

            {/* Mot de passe */}

            <div>
              <label
                className="
                block
                mb-2
                text-sm
                font-semibold
                text-[#062A25]
                "
              >
                🔒 Mot de passe
              </label>

              <div
                className="
                relative
                "
              >
                <input
                  type={afficherMotDePasse ? "text" : "password"}
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="
                  w-full
                  px-4
                  py-3
                  pr-12
                  rounded-xl
                  border
                  border-gray-200
                  focus:ring-2
                  focus:ring-[#23C483]
                  outline-none
                  "
                />

                <button
                  type="button"
                  onClick={() => setAfficherMotDePasse(!afficherMotDePasse)}
                  className="
                  absolute
                  right-4
                  top-1/2
                  -translate-y-1/2
                  "
                >
                  {afficherMotDePasse ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {/* Mot de passe oublié */}

            <div
              className="
              text-right
              "
            >
              <button
                type="button"
                className="
                text-sm
                text-[#23C483]
                font-semibold
                hover:underline
                "
              >
                Mot de passe oublié ?
              </button>
            </div>

            {/* Bouton connexion */}

            <button
              type="submit"
              disabled={chargement}
              className="
              w-full
              bg-[#062A25]
              hover:bg-[#041D19]
              text-white
              py-3
              rounded-xl
              font-semibold
              transition
              shadow-md
              disabled:opacity-50
              "
            >
              {chargement ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          {/* Sécurité */}

          <div
            className="
            mt-6
            bg-green-50
            rounded-xl
            p-4
            text-sm
            text-green-800
            "
          >
            🔐 Connexion sécurisée MadaGo
            <br />
            ✓ Vos données sont protégées
            <br />✓ Plateforme fiable
          </div>

          {/* Inscription */}

          <p
            className="
            text-center
            mt-6
            text-sm
            text-gray-500
            "
          >
            Pas encore de compte ?{" "}
            <Link
              to={
                redirect ? `/inscription?redirect=${redirect}` : "/inscription"
              }
              className="
              text-[#23C483]
              font-bold
              hover:underline
              "
            >
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
