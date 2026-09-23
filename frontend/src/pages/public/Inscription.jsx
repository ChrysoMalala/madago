import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import MessageErreur from "../../components/MessageErreur";

import logoMadaGo from "../../assets/images/logo-madaGo.png";
import loginBg from "../../assets/images/login-bg.jpg";

export default function Inscription() {
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    mot_de_passe: "",
  });

  const [afficherMotDePasse, setAfficherMotDePasse] = useState(false);

  const [erreur, setErreur] = useState("");

  const [chargement, setChargement] = useState(false);

  const { inscription } = useAuth();

  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  // =====================================================
  // PARCOURS D'ARRIVÉE
  // =====================================================

  const redirect = searchParams.get("redirect");

  const parcoursConducteur = redirect === "conducteur";

  // =====================================================
  // FORMULAIRE
  // =====================================================

  const handleChange = (e) => {
    setForm({
      ...form,

      [e.target.name]: e.target.value,
    });
  };

  // =====================================================
  // INSCRIPTION
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErreur("");

    setChargement(true);

    try {
      const utilisateur = await inscription(form);

      // =================================================
      // PARCOURS "DEVENIR CONDUCTEUR"
      // =================================================

      if (parcoursConducteur) {
        /*
         * Normalement, un compte qui vient juste
         * d'être créé n'est pas encore conducteur.
         *
         * On garde néanmoins cette vérification pour
         * que la logique reste cohérente si l'API
         * retourne déjà un utilisateur conducteur.
         */

        if (utilisateur?.role === "conducteur") {
          navigate("/conducteur", {
            replace: true,
          });

          return;
        }

        navigate("/conducteur/inscription", {
          replace: true,
        });

        return;
      }

      // =================================================
      // INSCRIPTION NORMALE
      // =================================================

      navigate("/", {
        replace: true,
      });
    } catch {
      setErreur("Une erreur est survenue. Vérifiez vos informations.");
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
      {/* ==========================
          PARTIE GAUCHE IMAGE
      =========================== */}

      <div
        className="
          hidden
          md:flex
          w-1/2
          bg-cover
          bg-center
          relative
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
            Rejoignez MadaGo 🚗
          </h1>

          <p
            className="
              text-lg
              text-gray-200
              leading-relaxed
            "
          >
            Créez votre compte et profitez d'une nouvelle expérience de
            transport simple, rapide et sécurisée à Madagascar.
          </p>

          <div
            className="
              mt-10
              space-y-4
              text-lg
            "
          >
            <p>✓ Réservation facile</p>

            <p>✓ Conducteurs vérifiés</p>

            <p>✓ Paiements pratiques</p>

            <p>✓ Plateforme sécurisée</p>
          </div>
        </div>
      </div>

      {/* ==========================
          FORMULAIRE
      =========================== */}

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
            bg-white
            rounded-3xl
            shadow-xl
            border
            border-gray-100
            p-8
            w-full
            max-w-md
          "
        >
          {/* Logo */}

          <div
            className="
              text-center
              mb-7
            "
          >
            <img
              src={logoMadaGo}
              alt="MadaGo"
              className="
                h-24
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
              {parcoursConducteur
                ? "Créez votre compte pour devenir conducteur"
                : "Créez votre compte MadaGo"}
            </p>
          </div>

          {/* Erreur */}

          <MessageErreur message={erreur} />

          {/* =================================================
              INFORMATION
          ================================================= */}

          {parcoursConducteur ? (
            <div
              className="
                bg-green-50
                border
                border-green-200
                rounded-xl
                p-4
                mb-6
                text-sm
                text-green-800
              "
            >
              🚗 <strong>Devenir conducteur</strong>
              <br />
              Créez d'abord votre compte MadaGo. Après l'inscription, vous
              pourrez compléter vos informations conducteur.
            </div>
          ) : (
            <div
              className="
                bg-green-50
                border
                border-green-200
                rounded-xl
                p-4
                mb-6
                text-sm
                text-green-800
              "
            >
              🧳 <strong>Compte MadaGo</strong>
              <br />
              Vous pourrez rechercher des trajets, réserver vos places et
              demander à devenir conducteur quand vous le souhaitez.
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="
              space-y-4
            "
          >
            {/* Nom prénom */}

            <div
              className="
                grid
                grid-cols-2
                gap-4
              "
            >
              <div>
                <label
                  className="
                    block
                    text-sm
                    font-semibold
                    text-[#062A25]
                    mb-2
                  "
                >
                  👤 Nom
                </label>

                <input
                  type="text"
                  name="nom"
                  value={form.nom}
                  onChange={handleChange}
                  placeholder="Rakoto"
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

              <div>
                <label
                  className="
                    block
                    text-sm
                    font-semibold
                    text-[#062A25]
                    mb-2
                  "
                >
                  👤 Prénom
                </label>

                <input
                  type="text"
                  name="prenom"
                  value={form.prenom}
                  onChange={handleChange}
                  placeholder="Jean"
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
            </div>

            {/* Email */}

            <div>
              <label
                className="
                  block
                  text-sm
                  font-semibold
                  text-[#062A25]
                  mb-2
                "
              >
                📧 Email
              </label>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
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

            {/* Téléphone */}

            <div>
              <label
                className="
                  block
                  text-sm
                  font-semibold
                  text-[#062A25]
                  mb-2
                "
              >
                📱 Téléphone
              </label>

              <input
                type="tel"
                name="telephone"
                value={form.telephone}
                onChange={handleChange}
                placeholder="+261341234567"
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
                  text-sm
                  font-semibold
                  text-[#062A25]
                  mb-2
                "
              >
                🔒 Mot de passe
              </label>

              <div className="relative">
                <input
                  type={afficherMotDePasse ? "text" : "password"}
                  name="mot_de_passe"
                  value={form.mot_de_passe}
                  onChange={handleChange}
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

            {/* Bouton */}

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
              {chargement ? "Création..." : "Créer mon compte"}
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
            🔐 Vos informations sont protégées
            <br />
            ✓ Plateforme sécurisée
            <br />✓ Données confidentielles
          </div>

          {/* Connexion */}

          <p
            className="
              text-center
              mt-6
              text-sm
              text-gray-500
            "
          >
            Déjà un compte ?{" "}
            <Link
              to={
                parcoursConducteur
                  ? "/connexion?redirect=conducteur"
                  : "/connexion"
              }
              className="
                text-[#23C483]
                font-bold
                hover:underline
              "
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
