import { useEffect, useRef, useState } from "react";

import { Link } from "react-router-dom";

import LayoutConducteur from "../../components/LayoutConducteur";
import Spinner from "../../components/Spinner";
import MessageErreur from "../../components/MessageErreur";
import NoteGlobale from "../../components/NoteGlobale";
import AvisCard from "../../components/AvisCard";

import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

// =======================================================
// IMAGES DOCUMENTS CONDUCTEUR
// =======================================================

const URL_BACKEND = "http://127.0.0.1:8000";

const urlImage = (chemin) => {
  if (!chemin) return null;

  if (chemin.startsWith("http://") || chemin.startsWith("https://")) {
    return chemin;
  }

  return `${URL_BACKEND}${chemin}`;
};

// =======================================================
// STATUTS
// =======================================================

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
  const { utilisateur, setUtilisateur } = useAuth();

  const inputPhotoRef = useRef(null);

  const [profil, setProfil] = useState(null);

  const [chargement, setChargement] = useState(true);

  const [erreur, setErreur] = useState("");

  const [succes, setSucces] = useState("");

  const [chargementPhoto, setChargementPhoto] = useState(false);

  const [donneesAvis, setDonneesAvis] = useState(null);

  // =====================================================
  // CHARGEMENT
  // =====================================================

  useEffect(() => {
    const chargerProfil = async () => {
      try {
        setErreur("");

        const reponse = await api.get("/conducteurs/moi/");

        setProfil(reponse.data);

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

  // =====================================================
  // PHOTO UNIQUE UTILISATEUR
  // =====================================================

  const choisirPhoto = () => {
    inputPhotoRef.current?.click();
  };

  const modifierPhoto = async (e) => {
    const fichier = e.target.files?.[0];

    if (!fichier) return;

    setErreur("");
    setSucces("");

    const typesAutorises = ["image/jpeg", "image/png", "image/webp"];

    if (!typesAutorises.includes(fichier.type)) {
      setErreur("Veuillez choisir une image JPG, PNG ou WEBP.");

      e.target.value = "";
      return;
    }

    if (fichier.size > 5 * 1024 * 1024) {
      setErreur("La photo ne doit pas dépasser 5 Mo.");

      e.target.value = "";
      return;
    }

    setChargementPhoto(true);

    try {
      const formData = new FormData();

      formData.append("photo_profil", fichier);

      const reponse = await api.put("/utilisateurs/moi/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Mise à jour immédiate de l'utilisateur global.
      // La Navbar, le profil passager et le profil
      // conducteur utilisent alors la même PDP.
      if (reponse.data?.utilisateur) {
        setUtilisateur(reponse.data.utilisateur);
      }

      setSucces("Photo de profil mise à jour avec succès !");

      setTimeout(() => {
        setSucces("");
      }, 3000);
    } catch (err) {
      console.error("Erreur lors de la modification de la PDP :", err);

      console.error("Réponse backend :", err.response?.data);

      setErreur(
        err.response?.data?.photo_profil?.[0] ||
          err.response?.data?.erreur ||
          "Impossible de modifier la photo de profil.",
      );
    } finally {
      setChargementPhoto(false);

      e.target.value = "";
    }
  };

  // =====================================================
  // CHARGEMENT
  // =====================================================

  if (chargement) {
    return (
      <LayoutConducteur>
        <div className="max-w-6xl mx-auto px-6 py-10">
          <Spinner />
        </div>
      </LayoutConducteur>
    );
  }

  // =====================================================
  // ERREUR
  // =====================================================

  if (!profil) {
    return (
      <LayoutConducteur>
        <div className="max-w-6xl mx-auto px-6 py-10">
          <MessageErreur message={erreur || "Profil introuvable."} />
        </div>
      </LayoutConducteur>
    );
  }

  const statut = STATUTS[profil.statut_validation] || STATUTS.en_attente;

  const photo = utilisateur?.photo_profil;

  return (
    <LayoutConducteur>
      <div
        className="
          max-w-6xl
          mx-auto
          px-4
          sm:px-6
          py-8
          space-y-6
        "
      >
        {/* ===============================================
            TITRE
        =============================================== */}

        <div>
          <div
            className="
              inline-flex
              items-center
              px-3
              py-1
              rounded-full
              bg-[#23C483]/10
              text-[#008F65]
              text-xs
              font-bold
              mb-3
            "
          >
            ESPACE CONDUCTEUR
          </div>

          <h1
            className="
              text-3xl
              md:text-4xl
              font-bold
              text-[#062A25]
            "
          >
            Mon profil conducteur
          </h1>

          <p
            className="
              text-gray-500
              mt-2
            "
          >
            Gérez votre identité, vos documents et vos informations conducteur
            MadaGo.
          </p>
        </div>

        <MessageErreur message={erreur} />

        {succes && (
          <div
            className="
              bg-green-50
              border
              border-green-200
              text-green-800
              px-5
              py-4
              rounded-2xl
            "
          >
            ✅ {succes}
          </div>
        )}

        {/* ===============================================
            CARTE PROFIL + PDP
        =============================================== */}

        <div
          className="
            overflow-hidden
            bg-white
            border
            border-gray-100
            rounded-3xl
            shadow-sm
          "
        >
          <div
            className="
              h-28
              bg-gradient-to-r
              from-[#062A25]
              to-[#008F65]
            "
          />

          <div
            className="
              px-6
              md:px-8
              pb-8
            "
          >
            <div
              className="
                flex
                flex-col
                md:flex-row
                md:items-end
                gap-5
              "
            >
              <div
                className="
                  relative
                  -mt-14
                  shrink-0
                "
              >
                <div
                  className="
                    w-28
                    h-28
                    md:w-32
                    md:h-32
                    rounded-full
                    border-4
                    border-white
                    shadow-lg
                    bg-[#EAF8F3]
                    overflow-hidden
                    flex
                    items-center
                    justify-center
                  "
                >
                  {photo ? (
                    <img
                      src={photo}
                      alt="Photo de profil"
                      className="
                        w-full
                        h-full
                        object-cover
                      "
                    />
                  ) : (
                    <span className="text-5xl">👤</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={choisirPhoto}
                  disabled={chargementPhoto}
                  title="Modifier la photo"
                  className="
                    absolute
                    right-0
                    bottom-1
                    w-10
                    h-10
                    rounded-full
                    bg-[#23C483]
                    text-white
                    border-4
                    border-white
                    shadow-md
                    flex
                    items-center
                    justify-center
                    hover:bg-[#1cab70]
                    transition
                    disabled:opacity-50
                  "
                >
                  {chargementPhoto ? "..." : "📷"}
                </button>

                <input
                  ref={inputPhotoRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={modifierPhoto}
                  className="hidden"
                />
              </div>

              <div
                className="
                  flex-1
                  pt-2
                "
              >
                <h2
                  className="
                    text-2xl
                    font-bold
                    text-[#062A25]
                  "
                >
                  {utilisateur?.prenom || profil.prenom}{" "}
                  {utilisateur?.nom || profil.nom}
                </h2>

                <p
                  className="
                    text-gray-500
                    mt-1
                  "
                >
                  {utilisateur?.email}
                </p>

                <div
                  className="
                    mt-3
                    flex
                    flex-wrap
                    gap-2
                  "
                >
                  <span
                    className={`
                      inline-flex
                      px-3
                      py-1
                      rounded-full
                      text-xs
                      font-semibold
                      ${statut.classe}
                    `}
                  >
                    {statut.texte}
                  </span>

                  <span
                    className="
                      inline-flex
                      px-3
                      py-1
                      rounded-full
                      bg-[#23C483]/10
                      text-[#008F65]
                      text-xs
                      font-semibold
                    "
                  >
                    🚗 Conducteur
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={choisirPhoto}
                disabled={chargementPhoto}
                className="
                  px-5
                  py-3
                  rounded-xl
                  border
                  border-gray-200
                  text-[#062A25]
                  text-sm
                  font-semibold
                  hover:border-[#23C483]
                  hover:bg-[#23C483]/5
                  transition
                  disabled:opacity-50
                "
              >
                {chargementPhoto
                  ? "Envoi..."
                  : photo
                    ? "📷 Modifier la photo"
                    : "📷 Ajouter une photo"}
              </button>
            </div>

            <div
              className="
                mt-6
                pt-5
                border-t
                border-gray-100
                flex
                flex-wrap
                gap-x-8
                gap-y-2
                text-sm
                text-gray-500
              "
            >
              <span>
                📅 Membre conducteur depuis :{" "}
                <strong
                  className="
                    text-gray-700
                    font-semibold
                  "
                >
                  {profil.date_creation
                    ? new Date(profil.date_creation).toLocaleDateString("fr-FR")
                    : "—"}
                </strong>
              </span>

              <span>🔄 PDP commune aux espaces passager et conducteur</span>
            </div>
          </div>
        </div>

        {/* ===============================================
            ACTIONS RAPIDES
        =============================================== */}

        <div
          className="
            grid
            md:grid-cols-3
            gap-5
          "
        >
          <ActionCard
            to="/conducteur/vehicules"
            icone="🚗"
            titre="Mes véhicules"
            description="Consultez et gérez vos véhicules."
          />

          <ActionCard
            to="/conducteur/vehicules/ajouter"
            icone="➕"
            titre="Ajouter véhicule"
            description="Enregistrez un nouveau véhicule."
          />

          <ActionCard
            to="/conducteur/modifier-profil"
            icone="✏️"
            titre="Modifier profil"
            description="Mettez à jour vos informations conducteur."
          />
        </div>

        {/* ===============================================
            REJET
        =============================================== */}

        {profil.statut_validation === "rejete" && profil.motif_rejet && (
          <MessageErreur message={`Motif du rejet : ${profil.motif_rejet}`} />
        )}

        {/* ===============================================
            AVIS
        =============================================== */}

        {donneesAvis && (
          <SectionCard titre="⭐ Réputation conducteur">
            <NoteGlobale
              noteMoyenne={donneesAvis.note_moyenne}
              totalAvis={donneesAvis.total_avis}
              repartition={donneesAvis.repartition}
            />

            {donneesAvis.avis?.length > 0 ? (
              <div className="space-y-3 mt-6">
                {donneesAvis.avis.slice(0, 5).map((avis) => (
                  <AvisCard key={avis.id} avis={avis} />
                ))}

                {donneesAvis.total_avis > 5 && (
                  <p
                    className="
                      text-[#008F65]
                      text-sm
                      text-center
                      font-semibold
                    "
                  >
                    Voir tous les avis ({donneesAvis.total_avis}) →
                  </p>
                )}
              </div>
            ) : (
              <div
                className="
                  bg-gray-50
                  rounded-2xl
                  p-5
                  mt-5
                  text-center
                  text-gray-400
                  text-sm
                "
              >
                Vous n'avez pas encore reçu d'avis.
              </div>
            )}
          </SectionCard>
        )}

        {/* ===============================================
            CIN
        =============================================== */}

        <SectionCard titre="🪪 Carte d'identité (CIN)">
          <InfoBox
            label="Numéro CIN"
            valeur={profil.numero_cin || "Non renseigné"}
          />

          <div
            className="
              grid
              md:grid-cols-2
              gap-5
              mt-5
            "
          >
            {urlImage(profil.cin_recto) && (
              <DocumentImage
                titre="Recto"
                src={urlImage(profil.cin_recto)}
                alt="CIN recto"
              />
            )}

            {urlImage(profil.cin_verso) && (
              <DocumentImage
                titre="Verso"
                src={urlImage(profil.cin_verso)}
                alt="CIN verso"
              />
            )}
          </div>
        </SectionCard>

        {/* ===============================================
            PERMIS
        =============================================== */}

        <SectionCard titre="🚗 Permis de conduire">
          <InfoBox
            label="Informations permis"
            valeur={
              profil.numero_permis
                ? `N° ${profil.numero_permis} · Catégorie ${profil.categorie_permis || "—"}`
                : "Non renseigné"
            }
          />

          <div
            className="
              grid
              md:grid-cols-2
              gap-5
              mt-5
            "
          >
            {urlImage(profil.permis_recto) && (
              <DocumentImage
                titre="Recto"
                src={urlImage(profil.permis_recto)}
                alt="Permis recto"
              />
            )}

            {urlImage(profil.permis_verso) && (
              <DocumentImage
                titre="Verso"
                src={urlImage(profil.permis_verso)}
                alt="Permis verso"
              />
            )}
          </div>
        </SectionCard>

        {/* ===============================================
            CONTACT URGENCE
        =============================================== */}

        <SectionCard titre="🆘 Contact d'urgence">
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
              {profil.contact_urgence_nom || "Non renseigné"}
            </p>

            <p
              className="
                text-gray-500
                mt-1
              "
            >
              📞 {profil.contact_urgence_telephone || "Non renseigné"}
            </p>
          </div>
        </SectionCard>

        {/* ===============================================
            MOBILE MONEY
        =============================================== */}

        <SectionCard titre="💰 Paiement Mobile Money">
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
              {profil.operateur_mobile_money || "—"}

              {profil.numero_mobile_money
                ? ` — ${profil.numero_mobile_money}`
                : ""}
            </p>

            <p
              className="
                text-gray-500
                mt-2
              "
            >
              Titulaire : {profil.titulaire_mobile_money || "Non renseigné"}
            </p>
          </div>
        </SectionCard>

        {/* ===============================================
            SÉCURITÉ
        =============================================== */}

        <div
          className="
            bg-green-50
            border
            border-green-200
            rounded-3xl
            p-6
            md:p-8
          "
        >
          <h2
            className="
              text-xl
              md:text-2xl
              font-bold
              text-[#062A25]
              mb-5
            "
          >
            🔐 Sécurité MadaGo
          </h2>

          <div
            className="
              grid
              sm:grid-cols-3
              gap-3
              text-sm
              text-gray-700
            "
          >
            <div className="bg-white/70 rounded-xl p-4">
              ✅ Identité enregistrée
            </div>

            <div className="bg-white/70 rounded-xl p-4">✅ Permis vérifié</div>

            <div className="bg-white/70 rounded-xl p-4">
              ✅ Documents conducteur disponibles
            </div>
          </div>
        </div>
      </div>
    </LayoutConducteur>
  );
}

// =======================================================
// COMPOSANTS INTERNES
// =======================================================

function ActionCard({ to, icone, titre, description }) {
  return (
    <Link
      to={to}
      className="
        group
        bg-white
        rounded-3xl
        border
        border-gray-100
        shadow-sm
        p-6
        hover:-translate-y-1
        hover:shadow-lg
        hover:border-[#23C483]/40
        transition
      "
    >
      <div
        className="
          w-12
          h-12
          rounded-2xl
          bg-[#23C483]/10
          flex
          items-center
          justify-center
          text-2xl
          mb-4
        "
      >
        {icone}
      </div>

      <h3
        className="
          font-bold
          text-[#062A25]
          group-hover:text-[#008F65]
          transition
        "
      >
        {titre}
      </h3>

      <p
        className="
          text-gray-500
          text-sm
          mt-2
          leading-relaxed
        "
      >
        {description}
      </p>
    </Link>
  );
}

function SectionCard({ titre, children }) {
  return (
    <div
      className="
        bg-white
        rounded-3xl
        border
        border-gray-100
        shadow-sm
        p-6
        md:p-8
      "
    >
      <h2
        className="
          text-xl
          md:text-2xl
          font-bold
          text-[#062A25]
          mb-5
        "
      >
        {titre}
      </h2>

      {children}
    </div>
  );
}

function InfoBox({ label, valeur }) {
  return (
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
        {label}
      </p>

      <p
        className="
          font-semibold
          text-gray-800
          mt-1
        "
      >
        {valeur}
      </p>
    </div>
  );
}

function DocumentImage({ titre, src, alt }) {
  return (
    <div
      className="
        rounded-2xl
        overflow-hidden
        border
        border-gray-200
        bg-white
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
        {titre}
      </p>

      <img
        src={src}
        alt={alt}
        className="
          w-full
          h-48
          object-cover
        "
      />
    </div>
  );
}
