import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import LayoutConducteur from "../../components/LayoutConducteur";
import Spinner from "../../components/Spinner";
import MessageErreur from "../../components/MessageErreur";
import NoteGlobale from "../../components/NoteGlobale";
import AvisCard from "../../components/AvisCard";

import api from "../../api/axios";

// Django renvoie des chemins relatifs (/media/...)
// Reconstruction URL complète backend
const URL_BACKEND = "http://127.0.0.1:8000";

const urlImage = (chemin) => (chemin ? `${URL_BACKEND}${chemin}` : null);

// Statuts conducteur

const STATUTS = {
  en_attente: {
    texte: "⏳ Validation en cours",

    classe: "bg-yellow-100 text-yellow-800",
  },

  valide: {
    texte: "🟢 Conducteur validé",

    classe: "bg-green-100 text-green-800",
  },

  rejete: {
    texte: "🔴 Profil rejeté",

    classe: "bg-red-100 text-red-800",
  },
};

export default function MonProfilConducteur() {
  const [profil, setProfil] = useState(null);

  const [chargement, setChargement] = useState(true);

  const [erreur, setErreur] = useState("");

  // Avis conducteur

  const [donneesAvis, setDonneesAvis] = useState(null);

  useEffect(() => {
    const chargerProfil = async () => {
      try {
        const reponse = await api.get("/conducteurs/moi/");

        setProfil(reponse.data);

        // ============================
        // Chargement avis conducteur
        // ============================

        const conducteurId = reponse.data.id;

        if (conducteurId) {
          try {
            const reponseAvis = await api.get(
              `/avis/conducteur/${conducteurId}/`,
            );

            setDonneesAvis(reponseAvis.data);
          } catch (errAvis) {
            console.warn("Impossible de charger les avis conducteur.", errAvis);
          }
        }
      } catch (err) {
        console.error(err);

        setErreur("Impossible de charger votre profil conducteur.");
      } finally {
        setChargement(false);
      }
    };

    chargerProfil();
  }, []);

  // ============================
  // Chargement
  // ============================

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

  // ============================
  // Erreur
  // ============================

  if (erreur || !profil) {
    return (
      <LayoutConducteur>
        <div
          className="
          max-w-6xl
          mx-auto
          "
        >
          <MessageErreur message={erreur || "Profil introuvable."} />
        </div>
      </LayoutConducteur>
    );
  }

  const statut = STATUTS[profil.statut_validation] || STATUTS.en_attente;
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
            HEADER PROFIL
        ============================ */}
        <div
          className="
          text-center
          mb-8
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
            Bonjour {profil.nom || "Conducteur"} 👋
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
            CARTE RESUME
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
          <div
            className="
            flex
            flex-col
            md:flex-row
            justify-between
            gap-6
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
                👤 Profil conducteur
              </h2>

              <p
                className="
                text-gray-600
                mt-3
                "
              >
                {profil.nom} {profil.prenom}
              </p>

              <p
                className="
                text-gray-500
                text-sm
                mt-1
                "
              >
                📅 Membre depuis :{" "}
                {new Date(profil.date_creation).toLocaleDateString("fr-FR")}
              </p>
            </div>

            <div>
              <span
                className={`
                inline-flex
                items-center
                px-4
                py-2
                rounded-full
                font-semibold
                text-sm

                ${statut.classe}

                `}
              >
                {statut.texte}
              </span>
            </div>
          </div>
        </div>
        {/* ============================
            ACTIONS RAPIDES
        ============================ */}
        <div
          className="
          grid
          md:grid-cols-3
          gap-5
          "
        >
          <Link
            to="/conducteur/vehicules"
            className="
            bg-white
            rounded-3xl
            border
            shadow-sm
            p-6
            hover:shadow-lg
            transition
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

            <h3
              className="
              font-bold
              text-[#062A25]
              "
            >
              Mes véhicules
            </h3>

            <p
              className="
              text-gray-500
              text-sm
              mt-2
              "
            >
              Consultez et gérez vos véhicules.
            </p>
          </Link>

          <Link
            to="/conducteur/vehicules/ajouter"
            className="
            bg-white
            rounded-3xl
            border
            shadow-sm
            p-6
            hover:shadow-lg
            transition
            "
          >
            <div
              className="
              text-4xl
              mb-3
              "
            >
              ➕
            </div>

            <h3
              className="
              font-bold
              text-[#062A25]
              "
            >
              Ajouter véhicule
            </h3>

            <p
              className="
              text-gray-500
              text-sm
              mt-2
              "
            >
              Enregistrez un nouveau véhicule.
            </p>
          </Link>

          <Link
            to="/conducteur/modifier-profil"
            className="
            bg-white
            rounded-3xl
            border
            shadow-sm
            p-6
            hover:shadow-lg
            transition
            "
          >
            <div
              className="
              text-4xl
              mb-3
              "
            >
              ✏️
            </div>

            <h3
              className="
              font-bold
              text-[#062A25]
              "
            >
              Modifier profil
            </h3>

            <p
              className="
              text-gray-500
              text-sm
              mt-2
              "
            >
              Mettez à jour vos informations.
            </p>
          </Link>
        </div>
        {/* ============================
            MESSAGE REJET
        ============================ */}
        {profil.statut_validation === "rejete" && profil.motif_rejet && (
          <MessageErreur message={`Motif du rejet : ${profil.motif_rejet}`} />
        )}
        {/* ============================
            AVIS CONDUCTEUR
        ============================ */}
        {donneesAvis && (
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
              mb-6
              "
            >
              ⭐ Réputation conducteur
            </h2>

            <NoteGlobale
              noteMoyenne={donneesAvis.note_moyenne}
              totalAvis={donneesAvis.total_avis}
              repartition={donneesAvis.repartition}
            />

            {donneesAvis.avis?.length > 0 ? (
              <div
                className="
                space-y-3
                mt-6
                "
              >
                {donneesAvis.avis

                  .slice(0, 5)

                  .map((avis) => (
                    <AvisCard key={avis.id} avis={avis} />
                  ))}

                {donneesAvis.total_avis > 5 && (
                  <p
                    className="
                    text-[#062A25]
                    text-sm
                    text-center
                    cursor-pointer
                    hover:underline
                    "
                  >
                    Voir tous les avis ({donneesAvis.total_avis}) →
                  </p>
                )}
              </div>
            ) : (
              <p
                className="
                text-gray-400
                text-sm
                text-center
                mt-5
                "
              >
                Vous n'avez pas encore reçu d'avis.
              </p>
            )}
          </div>
        )}{" "}
        {/* ============================
            CIN
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
            🪪 Carte d'identité (CIN)
          </h2>

          <div
            className="
            bg-gray-50
            rounded-2xl
            p-4
            mb-5
            "
          >
            <p
              className="
              text-gray-500
              text-sm
              "
            >
              Numéro CIN
            </p>

            <p
              className="
              font-semibold
              text-gray-800
              mt-1
              "
            >
              {profil.numero_cin}
            </p>
          </div>

          <div
            className="
            grid
            md:grid-cols-2
            gap-5
            "
          >
            {urlImage(profil.cin_recto) && (
              <div
                className="
                rounded-2xl
                overflow-hidden
                border
                "
              >
                <p
                  className="
                  bg-gray-50
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  text-gray-700
                  "
                >
                  Recto
                </p>

                <img
                  src={urlImage(profil.cin_recto)}
                  alt="CIN recto"
                  className="
                  w-full
                  h-40
                  object-cover
                  "
                />
              </div>
            )}

            {urlImage(profil.cin_verso) && (
              <div
                className="
                rounded-2xl
                overflow-hidden
                border
                "
              >
                <p
                  className="
                  bg-gray-50
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  text-gray-700
                  "
                >
                  Verso
                </p>

                <img
                  src={urlImage(profil.cin_verso)}
                  alt="CIN verso"
                  className="
                  w-full
                  h-40
                  object-cover
                  "
                />
              </div>
            )}
          </div>
        </div>
        {/* ============================
            PERMIS
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
            🚗 Permis de conduire
          </h2>

          <div
            className="
            bg-gray-50
            rounded-2xl
            p-4
            mb-5
            "
          >
            <p
              className="
              text-gray-500
              text-sm
              "
            >
              Informations permis
            </p>

            <p
              className="
              font-semibold
              text-gray-800
              mt-1
              "
            >
              N° {profil.numero_permis}
              {" · "}
              Catégorie {profil.categorie_permis}
            </p>
          </div>

          <div
            className="
            grid
            md:grid-cols-2
            gap-5
            "
          >
            {urlImage(profil.permis_recto) && (
              <img
                src={urlImage(profil.permis_recto)}
                alt="Permis recto"
                className="
                rounded-2xl
                border
                w-full
                h-40
                object-cover
                "
              />
            )}

            {urlImage(profil.permis_verso) && (
              <img
                src={urlImage(profil.permis_verso)}
                alt="Permis verso"
                className="
                rounded-2xl
                border
                w-full
                h-40
                object-cover
                "
              />
            )}
          </div>
        </div>
        {/* ============================
            CONTACT URGENCE
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
            🆘 Contact d'urgence
          </h2>

          <div
            className="
            bg-gray-50
            rounded-2xl
            p-5
            "
          >
            <p
              className="
              font-semibold
              text-gray-800
              "
            >
              {profil.contact_urgence_nom}
            </p>

            <p
              className="
              text-gray-500
              mt-1
              "
            >
              📞 {profil.contact_urgence_telephone}
            </p>
          </div>
        </div>
        {/* ============================
            MOBILE MONEY
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
            💰 Paiement Mobile Money
          </h2>

          <div
            className="
            bg-gray-50
            rounded-2xl
            p-5
            "
          >
            <p
              className="
              font-semibold
              text-gray-800
              "
            >
              {profil.operateur_mobile_money}

              {" — "}

              {profil.numero_mobile_money}
            </p>

            <p
              className="
              text-gray-500
              mt-2
              "
            >
              Titulaire : {profil.titulaire_mobile_money}
            </p>
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
            <p>✅ Identité enregistrée</p>

            <p>✅ Permis vérifié</p>

            <p>✅ Documents conducteur disponibles</p>
          </div>
        </div>
      </div>
    </LayoutConducteur>
  );
}
