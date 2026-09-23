import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import LayoutConducteur from "../../components/LayoutConducteur";
import Spinner from "../../components/Spinner";

import api from "../../api/axios";

export default function TableauBordConducteur() {
  const { utilisateur } = useAuth();

  const [conducteur, setConducteur] = useState(null);

  const [trajets, setTrajets] = useState([]);

  const [vehicules, setVehicules] = useState([]);

  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const chargerDonnees = async () => {
      try {
        const [resConducteur, resTrajets, resVehicules] = await Promise.all([
          api.get("/conducteurs/moi/"),

          api.get("/trajets/mes-trajets/"),

          api.get("/vehicules/"),
        ]);

        setConducteur(resConducteur.data);

        setTrajets(resTrajets.data);

        setVehicules(resVehicules.data);
      } catch (err) {
        console.error("Erreur chargement tableau de bord", err);
      } finally {
        setChargement(false);
      }
    };

    chargerDonnees();
  }, []);

  if (chargement) {
    return (
      <LayoutConducteur>
        <div
          className="
          max-w-6xl
          mx-auto
          "
        >
          <Spinner />
        </div>
      </LayoutConducteur>
    );
  }

  const trajetsAVenir = trajets.filter((t) => t.statut === "a_venir");

  const couleurStatut = {
    en_attente: "bg-yellow-100 text-yellow-800",

    valide: "bg-green-100 text-green-800",

    rejete: "bg-red-100 text-red-800",
  };

  const libelleStatut = {
    en_attente: "⏳ Validation en cours",

    valide: "🟢 Profil validé",

    rejete: "🔴 Profil rejeté",
  };

  const statutActuel = conducteur?.statut_validation || "en_attente";

  return (
    <LayoutConducteur>
      <div
        className="
        max-w-6xl
        mx-auto
        px-6
        py-8
        space-y-8
        "
      >
        {/* ============================
            HEADER
        ============================ */}
        <div
          className="
          text-center
          mb-10
          "
        >
          <img
            src="/src/assets/images/logoMadaGo.png"
            alt="MadaGo"
            className="
            h-24
            mx-auto
            object-contain
            mb-5
            "
          />

          <h1
            className="
            text-4xl
            font-bold
            text-[#062A25]
            "
          >
            Bonjour {utilisateur?.prenom || "Conducteur"} 👋
          </h1>

          <p
            className="
            text-gray-500
            mt-3
            text-lg
            "
          >
            Bienvenue dans votre espace conducteur MadaGo
          </p>
        </div>
        {/* ============================
            STATUT CONDUCTEUR
        ============================ */}
        {conducteur && (
          <div
            className="
            flex
            justify-center
            "
          >
            <span
              className={`
              px-5
              py-2
              rounded-full
              font-semibold
              text-sm

              ${couleurStatut[statutActuel]}

              `}
            >
              {libelleStatut[statutActuel]}
            </span>
          </div>
        )}
        {/* ============================
            PROFIL INCOMPLET
        ============================ */}
        {!conducteur && (
          <div
            className="
            bg-yellow-50
            border
            border-yellow-200
            rounded-3xl
            p-6
            "
          >
            <h2
              className="
              text-xl
              font-bold
              text-yellow-800
              mb-3
              "
            >
              ⚠️ Profil conducteur incomplet
            </h2>

            <p
              className="
              text-yellow-700
              mb-5
              "
            >
              Vous devez compléter votre profil conducteur pour publier des
              trajets.
            </p>

            <Link
              to="/conducteur/inscription"
              className="
              inline-block
              bg-yellow-500
              text-white
              px-6
              py-3
              rounded-xl
              font-semibold
              hover:bg-yellow-600
              transition
              "
            >
              Compléter mon profil
            </Link>
          </div>
        )}
        {/* ============================
            CARTE RESUME
        ============================ */}
        {conducteur && (
          <div
            className="
            bg-white
            rounded-3xl
            shadow-xl
            border
            p-8
            "
          >
            <div
              className="
              flex
              flex-col
              md:flex-row
              justify-between
              gap-5
              "
            >
              <div>
                <h2
                  className="
                  text-2xl
                  font-bold
                  text-[#062A25]
                  "
                >
                  👤 Votre profil conducteur
                </h2>

                <p
                  className="
                  text-gray-600
                  mt-3
                  "
                >
                  {conducteur.nom} {conducteur.prenom}
                </p>

                <p
                  className="
                  text-gray-500
                  text-sm
                  mt-2
                  "
                >
                  Membre depuis :{" "}
                  {conducteur.date_creation
                    ? new Date(conducteur.date_creation).toLocaleDateString(
                        "fr-FR",
                      )
                    : "--"}
                </p>
              </div>

              <div
                className="
                bg-green-50
                rounded-2xl
                px-6
                py-4
                "
              >
                <p
                  className="
                  text-sm
                  text-gray-500
                  "
                >
                  Note moyenne
                </p>

                <p
                  className="
                  text-3xl
                  font-bold
                  text-[#062A25]
                  "
                >
                  ⭐ {conducteur.note_moyenne ? conducteur.note_moyenne : "--"}
                  /5
                </p>
              </div>
            </div>
          </div>
        )}
        {/* ============================
            STATISTIQUES
        ============================ */}
        <div
          className="
          grid
          grid-cols-1
          md:grid-cols-3
          gap-6
          "
        >
          <div
            className="
            bg-white
            rounded-3xl
            shadow-lg
            border
            p-6
            "
          >
            <div
              className="
              text-4xl
              mb-3
              "
            >
              🛣️
            </div>

            <p
              className="
              text-4xl
              font-bold
              text-[#062A25]
              "
            >
              {trajetsAVenir.length}
            </p>

            <p
              className="
              text-gray-500
              mt-2
              "
            >
              Trajets à venir
            </p>
          </div>

          <div
            className="
            bg-white
            rounded-3xl
            shadow-lg
            border
            p-6
            "
          >
            <div
              className="
              text-4xl
              mb-3
              "
            >
              🚗
            </div>

            <p
              className="
              text-4xl
              font-bold
              text-[#062A25]
              "
            >
              {vehicules.length}
            </p>

            <p
              className="
              text-gray-500
              mt-2
              "
            >
              Véhicules enregistrés
            </p>
          </div>

          <div
            className="
            bg-white
            rounded-3xl
            shadow-lg
            border
            p-6
            "
          >
            <div
              className="
              text-4xl
              mb-3
              "
            >
              ⭐
            </div>

            <p
              className="
              text-4xl
              font-bold
              text-[#062A25]
              "
            >
              {conducteur?.note_moyenne ? `${conducteur.note_moyenne}/5` : "--"}
            </p>

            <p
              className="
              text-gray-500
              mt-2
              "
            >
              Note moyenne
            </p>
          </div>
        </div>{" "}
        {/* ============================
            ACTIONS RAPIDES
        ============================ */}
        <div>
          <h2
            className="
            text-2xl
            font-bold
            text-[#062A25]
            mb-5
            "
          >
            Actions rapides
          </h2>

          <div
            className="
            grid
            grid-cols-1
            md:grid-cols-2
            gap-5
            "
          >
            <Link
              to="/conducteur/trajets/publier"
              className="
              bg-[#062A25]
              text-white
              rounded-3xl
              p-7
              hover:bg-[#041D19]
              transition
              shadow-lg
              "
            >
              <div
                className="
                text-4xl
                mb-4
                "
              >
                🗺️
              </div>

              <h3
                className="
                text-xl
                font-bold
                "
              >
                Publier un trajet
              </h3>

              <p
                className="
                text-gray-200
                mt-2
                text-sm
                "
              >
                Créez un nouveau trajet pour vos passagers.
              </p>
            </Link>

            <Link
              to="/conducteur/vehicules"
              className="
              bg-white
              border
              rounded-3xl
              p-7
              hover:shadow-lg
              transition
              "
            >
              <div
                className="
                text-4xl
                mb-4
                "
              >
                🚗
              </div>

              <h3
                className="
                text-xl
                font-bold
                text-[#062A25]
                "
              >
                Mes véhicules
              </h3>

              <p
                className="
                text-gray-500
                mt-2
                text-sm
                "
              >
                Gérez vos véhicules enregistrés.
              </p>
            </Link>

            <Link
              to="/conducteur/trajets"
              className="
              bg-white
              border
              rounded-3xl
              p-7
              hover:shadow-lg
              transition
              "
            >
              <div
                className="
                text-4xl
                mb-4
                "
              >
                📋
              </div>

              <h3
                className="
                text-xl
                font-bold
                text-[#062A25]
                "
              >
                Mes trajets
              </h3>

              <p
                className="
                text-gray-500
                mt-2
                text-sm
                "
              >
                Consultez vos trajets publiés.
              </p>
            </Link>

            <Link
              to="/conducteur/revenus"
              className="
              bg-white
              border
              rounded-3xl
              p-7
              hover:shadow-lg
              transition
              "
            >
              <div
                className="
                text-4xl
                mb-4
                "
              >
                💰
              </div>

              <h3
                className="
                text-xl
                font-bold
                text-[#062A25]
                "
              >
                Mes revenus
              </h3>

              <p
                className="
                text-gray-500
                mt-2
                text-sm
                "
              >
                Consultez vos statistiques.
              </p>
            </Link>
          </div>
        </div>
        {/* ============================
            ACTIVITE RAPIDE
        ============================ */}
        <div
          className="
          bg-white
          rounded-3xl
          border
          shadow-xl
          p-8
          "
        >
          <h2
            className="
            text-2xl
            font-bold
            text-[#062A25]
            mb-5
            "
          >
            📊 Résumé activité
          </h2>

          <div
            className="
            grid
            md:grid-cols-3
            gap-5
            "
          >
            <div
              className="
              bg-gray-50
              rounded-2xl
              p-5
              "
            >
              <p
                className="
                text-gray-500
                text-sm
                "
              >
                Véhicules actifs
              </p>

              <p
                className="
                text-3xl
                font-bold
                text-[#062A25]
                mt-2
                "
              >
                {vehicules.length}
              </p>
            </div>

            <div
              className="
              bg-gray-50
              rounded-2xl
              p-5
              "
            >
              <p
                className="
                text-gray-500
                text-sm
                "
              >
                Prochains trajets
              </p>

              <p
                className="
                text-3xl
                font-bold
                text-[#062A25]
                mt-2
                "
              >
                {trajetsAVenir.length}
              </p>
            </div>

            <div
              className="
              bg-gray-50
              rounded-2xl
              p-5
              "
            >
              <p
                className="
                text-gray-500
                text-sm
                "
              >
                Réputation
              </p>

              <p
                className="
                text-3xl
                font-bold
                text-[#062A25]
                mt-2
                "
              >
                ⭐{conducteur?.note_moyenne || "--"}
              </p>
            </div>
          </div>
        </div>
        {/* ============================
            SECURITE MADAGO
        ============================ */}
        <div
          className="
          bg-green-50
          border
          border-green-200
          rounded-3xl
          p-8
          "
        >
          <h2
            className="
            text-2xl
            font-bold
            text-[#062A25]
            mb-5
            "
          >
            🔐 Sécurité MadaGo
          </h2>

          <div
            className="
            space-y-3
            text-gray-700
            "
          >
            <p>✅ Profil conducteur enregistré</p>

            <p>✅ Documents transmis</p>

            <p>✅ Compte protégé MadaGo</p>
          </div>
        </div>
      </div>
    </LayoutConducteur>
  );
}
