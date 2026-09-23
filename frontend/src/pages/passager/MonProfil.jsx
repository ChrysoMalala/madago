import { useEffect, useRef, useState } from "react";

import LayoutPassager from "../../components/LayoutPassager";
import Spinner from "../../components/Spinner";
import MessageErreur from "../../components/MessageErreur";

import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

export default function MonProfilPassager() {
  const { utilisateur, mettreAJourUtilisateur } = useAuth();

  const inputPhotoRef = useRef(null);

  const [profil, setProfil] = useState(null);

  const [chargement, setChargement] = useState(true);

  const [erreur, setErreur] = useState("");

  const [succes, setSucces] = useState("");

  const [modeEdition, setModeEdition] = useState(false);

  const [modeMdp, setModeMdp] = useState(false);

  const [chargementSauvegarde, setChargementSauvegarde] = useState(false);

  const [chargementPhoto, setChargementPhoto] = useState(false);

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    email: "",
  });

  const [formMdp, setFormMdp] = useState({
    ancien_mot_de_passe: "",
    nouveau_mot_de_passe: "",
    confirmer_mot_de_passe: "",
  });

  // =====================================================
  // MESSAGE TEMPORAIRE
  // =====================================================

  const afficherSucces = (message) => {
    setSucces(message);

    setTimeout(() => {
      setSucces("");
    }, 3000);
  };

  // =====================================================
  // CHARGEMENT DU PROFIL
  // =====================================================

  useEffect(() => {
    const chargerProfil = async () => {
      try {
        setErreur("");

        const res = await api.get("/utilisateurs/moi/");

        setProfil(res.data);

        setForm({
          nom: res.data.nom || "",
          prenom: res.data.prenom || "",
          telephone: res.data.telephone || "",
          email: res.data.email || "",
        });

        mettreAJourUtilisateur(res.data);
      } catch (err) {
        console.error(err);

        setErreur("Erreur de chargement du profil.");
      } finally {
        setChargement(false);
      }
    };

    chargerProfil();
  }, [mettreAJourUtilisateur]);

  // =====================================================
  // MODIFICATION DES CHAMPS
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((precedent) => ({
      ...precedent,
      [name]: value,
    }));
  };

  const handleChangeMdp = (e) => {
    const { name, value } = e.target;

    setFormMdp((precedent) => ({
      ...precedent,
      [name]: value,
    }));
  };

  // =====================================================
  // PHOTO DE PROFIL
  // =====================================================

  const handleChoisirPhoto = () => {
    inputPhotoRef.current?.click();
  };

  const handlePhotoChange = async (e) => {
    const fichier = e.target.files?.[0];

    if (!fichier) return;

    setErreur("");
    setSucces("");

    // Types autorisés

    const typesAutorises = ["image/jpeg", "image/png", "image/webp"];

    if (!typesAutorises.includes(fichier.type)) {
      setErreur("Veuillez choisir une image JPG, PNG ou WEBP.");

      e.target.value = "";

      return;
    }

    // Limite 5 Mo

    if (fichier.size > 5 * 1024 * 1024) {
      setErreur("La photo ne doit pas dépasser 5 Mo.");

      e.target.value = "";

      return;
    }

    setChargementPhoto(true);

    try {
      const formData = new FormData();

      formData.append("photo_profil", fichier);

      const res = await api.put("/utilisateurs/moi/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const utilisateurMisAJour = res.data.utilisateur;

      setProfil(utilisateurMisAJour);

      mettreAJourUtilisateur(utilisateurMisAJour);

      afficherSucces("Photo de profil mise à jour avec succès !");
    } catch (err) {
      console.error(err);

      const erreurPhoto = err.response?.data?.photo_profil?.[0];

      setErreur(erreurPhoto || "Impossible de modifier la photo de profil.");
    } finally {
      setChargementPhoto(false);

      e.target.value = "";
    }
  };

  // =====================================================
  // SAUVEGARDE INFORMATIONS PERSONNELLES
  // =====================================================

  const handleSauvegarder = async (e) => {
    e.preventDefault();

    setChargementSauvegarde(true);

    setErreur("");
    setSucces("");

    try {
      const res = await api.put("/utilisateurs/moi/", form);

      const utilisateurMisAJour = res.data.utilisateur;

      setProfil(utilisateurMisAJour);

      mettreAJourUtilisateur(utilisateurMisAJour);

      setModeEdition(false);

      afficherSucces("Profil mis à jour avec succès !");
    } catch (err) {
      console.error(err);

      setErreur(
        err.response?.data?.erreur ||
          "Erreur lors de la mise à jour du profil.",
      );
    } finally {
      setChargementSauvegarde(false);
    }
  };

  // =====================================================
  // CHANGER MOT DE PASSE
  // =====================================================

  const handleChangerMdp = async (e) => {
    e.preventDefault();

    setErreur("");
    setSucces("");

    if (formMdp.nouveau_mot_de_passe !== formMdp.confirmer_mot_de_passe) {
      setErreur("Les mots de passe ne correspondent pas.");

      return;
    }

    if (formMdp.nouveau_mot_de_passe.length < 8) {
      setErreur("Le nouveau mot de passe doit contenir au moins 8 caractères.");

      return;
    }

    setChargementSauvegarde(true);

    try {
      await api.post("/auth/changer-mdp/", {
        ancien_mot_de_passe: formMdp.ancien_mot_de_passe,

        nouveau_mot_de_passe: formMdp.nouveau_mot_de_passe,
      });

      setModeMdp(false);

      setFormMdp({
        ancien_mot_de_passe: "",
        nouveau_mot_de_passe: "",
        confirmer_mot_de_passe: "",
      });

      afficherSucces("Mot de passe changé avec succès !");
    } catch (err) {
      console.error(err);

      setErreur(
        err.response?.data?.erreur ||
          "Erreur lors du changement de mot de passe.",
      );
    } finally {
      setChargementSauvegarde(false);
    }
  };

  // =====================================================
  // ANNULER MODIFICATION PROFIL
  // =====================================================

  const annulerEdition = () => {
    setModeEdition(false);

    setForm({
      nom: profil?.nom || "",
      prenom: profil?.prenom || "",
      telephone: profil?.telephone || "",
      email: profil?.email || "",
    });
  };

  // =====================================================
  // CHARGEMENT
  // =====================================================

  if (chargement) {
    return (
      <LayoutPassager>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          <Spinner />
        </div>
      </LayoutPassager>
    );
  }

  // =====================================================
  // DONNÉES AFFICHÉES
  // =====================================================

  const utilisateurAffiche = utilisateur || profil;

  const photo = utilisateurAffiche?.photo_profil;

  return (
    <LayoutPassager>
      <div
        className="
          max-w-5xl
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
            ESPACE PASSAGER
          </div>

          <h1
            className="
              text-3xl
              md:text-4xl
              font-bold
              text-[#062A25]
            "
          >
            Mon profil
          </h1>

          <p
            className="
              mt-2
              text-gray-500
            "
          >
            Gérez vos informations personnelles et la sécurité de votre compte
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
            CARTE PRINCIPALE / PDP
        =============================================== */}

        <div
          className="
            relative
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
              {/* PDP */}

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
                    bg-[#EAF8F3]
                    shadow-lg
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
                    <span
                      className="
                        text-5xl
                      "
                    >
                      👤
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleChoisirPhoto}
                  disabled={chargementPhoto}
                  title="Modifier la photo de profil"
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
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>

              {/* Identité */}

              <div
                className="
                  flex-1
                  pt-2
                  md:pb-1
                "
              >
                <h2
                  className="
                    text-2xl
                    font-bold
                    text-[#062A25]
                  "
                >
                  {utilisateurAffiche?.prenom} {utilisateurAffiche?.nom}
                </h2>

                <p
                  className="
                    text-gray-500
                    mt-1
                  "
                >
                  {utilisateurAffiche?.email}
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
                    className="
                      inline-flex
                      items-center
                      px-3
                      py-1
                      rounded-full
                      bg-[#23C483]/10
                      text-[#008F65]
                      text-xs
                      font-semibold
                    "
                  >
                    🧳 Passager
                  </span>

                  <span
                    className="
                      inline-flex
                      items-center
                      px-3
                      py-1
                      rounded-full
                      bg-green-50
                      text-green-700
                      text-xs
                      font-semibold
                    "
                  >
                    ✓ Compte actif
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleChoisirPhoto}
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

            <p
              className="
                mt-5
                text-xs
                text-gray-400
              "
            >
              JPG, PNG ou WEBP · 5 Mo maximum. Cette photo est commune à vos
              espaces passager et conducteur.
            </p>
          </div>
        </div>

        {/* ===============================================
            INFORMATIONS PERSONNELLES
        =============================================== */}

        <div
          className="
            bg-white
            border
            border-gray-100
            rounded-3xl
            shadow-sm
            p-6
            md:p-8
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
              gap-4
              mb-6
            "
          >
            <div>
              <h3
                className="
                  text-xl
                  font-bold
                  text-[#062A25]
                "
              >
                👤 Informations personnelles
              </h3>

              <p
                className="
                  text-sm
                  text-gray-500
                  mt-1
                "
              >
                Vos informations principales.
              </p>
            </div>

            {!modeEdition && (
              <button
                type="button"
                onClick={() => setModeEdition(true)}
                className="
                  text-[#008F65]
                  text-sm
                  font-semibold
                  hover:underline
                "
              >
                ✏️ Modifier
              </button>
            )}
          </div>

          {!modeEdition ? (
            <div
              className="
                grid
                md:grid-cols-2
                gap-4
              "
            >
              <Info label="Nom" valeur={profil?.nom} />

              <Info label="Prénom" valeur={profil?.prenom} />

              <Info label="E-mail" valeur={profil?.email} />

              <Info
                label="Téléphone"
                valeur={profil?.telephone || "Non renseigné"}
              />

              <Info
                label="Membre depuis"
                valeur={
                  profil?.date_inscription
                    ? new Date(profil.date_inscription).toLocaleDateString(
                        "fr-FR",
                      )
                    : "—"
                }
              />
            </div>
          ) : (
            <form onSubmit={handleSauvegarder} className="space-y-5">
              <div
                className="
                  grid
                  md:grid-cols-2
                  gap-5
                "
              >
                <Champ
                  label="Nom"
                  name="nom"
                  value={form.nom}
                  onChange={handleChange}
                  required
                />

                <Champ
                  label="Prénom"
                  name="prenom"
                  value={form.prenom}
                  onChange={handleChange}
                  required
                />
              </div>

              <Champ
                label="E-mail"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
              />

              <Champ
                label="Téléphone"
                name="telephone"
                value={form.telephone}
                onChange={handleChange}
                placeholder="+261 34 XX XXX XX"
              />

              <div
                className="
                  flex
                  flex-col-reverse
                  sm:flex-row
                  justify-end
                  gap-3
                  pt-2
                "
              >
                <button
                  type="button"
                  onClick={annulerEdition}
                  className="
                    px-6
                    py-3
                    rounded-xl
                    border
                    border-gray-200
                    font-semibold
                    text-gray-600
                    hover:bg-gray-50
                    transition
                  "
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={chargementSauvegarde}
                  className="
                    px-6
                    py-3
                    rounded-xl
                    bg-[#062A25]
                    text-white
                    font-semibold
                    hover:bg-[#041D19]
                    transition
                    disabled:opacity-50
                  "
                >
                  {chargementSauvegarde ? "Sauvegarde..." : "✓ Sauvegarder"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ===============================================
            SÉCURITÉ
        =============================================== */}

        <div
          className="
            bg-white
            border
            border-gray-100
            rounded-3xl
            shadow-sm
            p-6
            md:p-8
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
              gap-4
              mb-6
            "
          >
            <div>
              <h3
                className="
                  text-xl
                  font-bold
                  text-[#062A25]
                "
              >
                🔐 Sécurité
              </h3>

              <p
                className="
                  text-sm
                  text-gray-500
                  mt-1
                "
              >
                Gérez la sécurité de votre compte.
              </p>
            </div>

            {!modeMdp && (
              <button
                type="button"
                onClick={() => setModeMdp(true)}
                className="
                  text-[#008F65]
                  text-sm
                  font-semibold
                  hover:underline
                "
              >
                ✏️ Changer le mot de passe
              </button>
            )}
          </div>

          {!modeMdp ? (
            <div
              className="
                bg-gray-50
                rounded-2xl
                px-5
                py-4
                flex
                justify-between
                items-center
              "
            >
              <span
                className="
                  text-sm
                  text-gray-500
                "
              >
                Mot de passe
              </span>

              <span
                className="
                  font-semibold
                  tracking-widest
                "
              >
                ••••••••
              </span>
            </div>
          ) : (
            <form onSubmit={handleChangerMdp} className="space-y-5">
              <Champ
                label="Ancien mot de passe"
                type="password"
                name="ancien_mot_de_passe"
                value={formMdp.ancien_mot_de_passe}
                onChange={handleChangeMdp}
                required
              />

              <div
                className="
                  grid
                  md:grid-cols-2
                  gap-5
                "
              >
                <Champ
                  label="Nouveau mot de passe"
                  type="password"
                  name="nouveau_mot_de_passe"
                  value={formMdp.nouveau_mot_de_passe}
                  onChange={handleChangeMdp}
                  required
                />

                <Champ
                  label="Confirmer le mot de passe"
                  type="password"
                  name="confirmer_mot_de_passe"
                  value={formMdp.confirmer_mot_de_passe}
                  onChange={handleChangeMdp}
                  required
                />
              </div>

              <div
                className="
                  flex
                  flex-col-reverse
                  sm:flex-row
                  justify-end
                  gap-3
                "
              >
                <button
                  type="button"
                  onClick={() => {
                    setModeMdp(false);

                    setFormMdp({
                      ancien_mot_de_passe: "",
                      nouveau_mot_de_passe: "",
                      confirmer_mot_de_passe: "",
                    });
                  }}
                  className="
                    px-6
                    py-3
                    rounded-xl
                    border
                    border-gray-200
                    font-semibold
                    text-gray-600
                    hover:bg-gray-50
                  "
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={chargementSauvegarde}
                  className="
                    px-6
                    py-3
                    rounded-xl
                    bg-[#062A25]
                    text-white
                    font-semibold
                    hover:bg-[#041D19]
                    disabled:opacity-50
                  "
                >
                  {chargementSauvegarde ? "Changement..." : "🔒 Changer"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ===============================================
            COMPTE
        =============================================== */}

        <div
          className="
            bg-white
            border
            border-gray-100
            rounded-3xl
            shadow-sm
            p-6
            md:p-8
          "
        >
          <h3
            className="
              text-xl
              font-bold
              text-[#062A25]
              mb-6
            "
          >
            ⚙️ Mon compte
          </h3>

          <div
            className="
              grid
              md:grid-cols-3
              gap-4
            "
          >
            <Info label="Espace" valeur="Passager" />

            <Info label="Statut" valeur="✓ Actif" />

            <Info
              label="Inscription"
              valeur={
                profil?.date_inscription
                  ? new Date(profil.date_inscription).toLocaleDateString(
                      "fr-FR",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      },
                    )
                  : "—"
              }
            />
          </div>
        </div>

        {/* ===============================================
            INFO PDP UNIQUE
        =============================================== */}

        <div
          className="
            bg-green-50
            border
            border-green-200
            rounded-3xl
            p-6
          "
        >
          <h3
            className="
              font-bold
              text-[#062A25]
            "
          >
            🔐 Votre identité MadaGo
          </h3>

          <p
            className="
              text-sm
              text-gray-600
              mt-2
              leading-relaxed
            "
          >
            Votre compte MadaGo possède une seule photo de profil. Si vous êtes
            également conducteur, toute modification effectuée ici sera
            automatiquement visible dans votre espace conducteur.
          </p>
        </div>
      </div>
    </LayoutPassager>
  );
}

// =======================================================
// PETITS COMPOSANTS INTERNES
// =======================================================

function Info({ label, valeur }) {
  return (
    <div
      className="
        bg-gray-50
        rounded-2xl
        px-5
        py-4
      "
    >
      <p
        className="
          text-xs
          text-gray-400
          mb-1
        "
      >
        {label}
      </p>

      <p
        className="
          text-sm
          font-semibold
          text-gray-800
          break-words
        "
      >
        {valeur || "—"}
      </p>
    </div>
  );
}

function Champ({ label, type = "text", ...props }) {
  return (
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
        {label}
      </label>

      <input
        type={type}
        {...props}
        className="
          w-full
          border
          border-gray-200
          rounded-xl
          px-4
          py-3
          outline-none
          focus:ring-2
          focus:ring-[#23C483]
          focus:border-transparent
          transition
        "
      />
    </div>
  );
}
