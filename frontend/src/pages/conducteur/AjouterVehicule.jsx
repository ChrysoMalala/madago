import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../../components/Navbar";
//import MessageErreur from "../../components/MessageErreur";
import api from "../../api/axios";

//import logoMadaGo from "../../assets/images/logo-madaGo.png";

export default function AjouterVehicule() {
  const navigate = useNavigate();

  const [etape, setEtape] = useState(1);

  const [erreur, setErreur] = useState("");

  const [envoi, setEnvoi] = useState(false);

  const [messageSucces, setMessageSucces] = useState("");

  const [donnees, setDonnees] = useState({
    type_vehicule: "taxi_brousse",

    marque: "",
    modele: "",
    annee: "",

    couleur: "",

    immatriculation: "",

    nombre_places: "",

    type_carburant: "diesel",

    equipements: "",

    numero_assurance: "",

    date_expiration_assurance: "",

    date_visite_technique: "",

    date_expiration_visite: "",

    numero_licence: "",

    cooperative: "",

    zone_exploitation: "",

    carte_grise_recto: null,

    carte_grise_verso: null,

    attestation_assurance: null,

    certificat_visite: null,

    licence_transport: null,

    photos: [],
  });

  // ============================
  // Gestion des dates
  // ============================

  // Date de demain (pour assurance et expiration visite)
  const dateDemain = () => {
    const date = new Date();

    date.setDate(date.getDate() + 1);

    return date.toISOString().split("T")[0];
  };

  // Date du jour (pour empêcher les dates futures)
  const dateAujourdHui = () => {
    const date = new Date();

    return date.toISOString().split("T")[0];
  };

  // Année actuelle
  const anneeActuelle = new Date().getFullYear();

  // Liste des années véhicule (1995 → année actuelle)
  const anneesVehicule = Array.from(
    {
      length: anneeActuelle - 1995 + 1,
    },
    (_, index) => anneeActuelle - index,
  );

  // ============================
  // Gestion champs
  // ============================

  const modifierChamp = (e) => {
    const {
      name,

      value,

      files,
    } = e.target;

    setDonnees({
      ...donnees,

      [name]: files ? files[0] : value,
    });
  };

  // ============================
  // Gestion photos véhicule
  // ============================

  const ajouterPhotos = (e) => {
    const nouvellesPhotos = Array.from(e.target.files);

    const total = [...donnees.photos, ...nouvellesPhotos].slice(0, 4);

    setDonnees({
      ...donnees,

      photos: total,
    });
  };

  const supprimerPhoto = (index) => {
    const nouvellesPhotos = donnees.photos.filter((_, i) => i !== index);

    setDonnees({
      ...donnees,

      photos: nouvellesPhotos,
    });
  };

  // ============================
  // Validation étape 1
  // ============================

  const validerEtape1 = () => {
    if (!donnees.marque.trim()) return "La marque est obligatoire.";

    if (!donnees.modele.trim()) return "Le modèle est obligatoire.";

    if (!donnees.couleur.trim()) return "La couleur est obligatoire.";

    if (!donnees.immatriculation.trim())
      return "L'immatriculation est obligatoire.";

    const annee = Number(donnees.annee);

    if (
      !donnees.annee ||
      isNaN(annee) ||
      annee < 1995 ||
      annee > new Date().getFullYear()
    )
      return "Veuillez saisir une année valide.";

    const places = Number(donnees.nombre_places);

    if (!donnees.nombre_places || isNaN(places) || places < 1 || places > 50)
      return "Le nombre de places doit être compris entre 1 et 50.";

    return "";
  };

  // ============================
  // Validation étape 2
  // ============================

  const validerEtape2 = () => {
    if (!donnees.numero_assurance.trim())
      return "Le numéro d'assurance est obligatoire.";

    if (!donnees.date_expiration_assurance)
      return "La date d'expiration de l'assurance est obligatoire.";

    if (!donnees.date_visite_technique)
      return "La date de visite technique est obligatoire.";

    if (!donnees.date_expiration_visite)
      return "La date d'expiration de visite est obligatoire.";

    return "";
  };

  const suivant = () => {
    setErreur("");

    if (etape === 1) {
      const erreurEtape = validerEtape1();

      if (erreurEtape) {
        setErreur(erreurEtape);

        return;
      }
    }

    if (etape === 2) {
      const erreurEtape = validerEtape2();

      if (erreurEtape) {
        setErreur(erreurEtape);

        return;
      }
    }

    setEtape(etape + 1);
  };

  const precedent = () => {
    setErreur("");

    setEtape(etape - 1);
  };

  // ============================
  // Envoi formulaire
  // ============================

  const soumettre = async (e) => {
    e.preventDefault();

    setErreur("");

    setEnvoi(true);

    const formData = new FormData();

    Object.entries(donnees).forEach(([cle, valeur]) => {
      if (cle !== "photos" && valeur !== null && valeur !== "") {
        formData.append(
          cle,

          valeur,
        );
      }
    });

    // Photos multiples

    donnees.photos.forEach((photo) => {
      formData.append(
        "photos",

        photo,
      );
    });

    try {
      await api.post(
        "/vehicules/",

        formData,

        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setMessageSucces("Votre véhicule a été envoyé pour validation.");
    } catch (err) {
      console.error(err);

      setErreur("Impossible d'ajouter le véhicule. Vérifiez vos informations.");
    } finally {
      setEnvoi(false);
    }
  }; // ============================
  // Affichage succès
  // ============================

  if (messageSucces) {
    return (
      <div
        className="
        min-h-screen
        bg-gray-50
        "
      >
        <Navbar />

        <div
          className="
          max-w-lg
          mx-auto
          px-6
          py-20
          text-center
          "
        >
          <div className="text-6xl mb-5">✅</div>

          <h1
            className="
            text-3xl
            font-bold
            text-[#062A25]
            mb-4
            "
          >
            Véhicule enregistré
          </h1>

          <p
            className="
            text-gray-600
            mb-8
            "
          >
            {messageSucces}
          </p>

          <button
            onClick={() => navigate("/conducteur/vehicules")}
            className="
            bg-[#062A25]
            text-white
            px-8
            py-3
            rounded-xl
            font-semibold
            hover:bg-[#041D19]
            transition
            "
          >
            Voir mes véhicules
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="
      min-h-screen
      bg-gray-50
      "
    >
      <Navbar />

      <div
        className="
        max-w-6xl
        mx-auto
        px-6
        pt-28
        pb-12
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
          {/* <img
            src={logoMadaGo}
            alt="MadaGo"
            className="
            h-24
            mx-auto
            object-contain
            mb-5
            "
          /> */}

          <h1
            className="
            text-4xl
            font-bold
            text-[#062A25]
            "
          >
            Ajouter un véhicule 🚗
          </h1>

          <p
            className="
            text-gray-500
            mt-3
            text-lg
            "
          >
            Enregistrez votre véhicule pour proposer vos trajets sur MadaGo.
          </p>
        </div>

        {/* ============================
            AVANTAGES
        ============================ */}

        <div
          className="
          grid
          md:grid-cols-3
          gap-5
          mb-10
          "
        >
          <div
            className="
            bg-white
            rounded-3xl
            border
            shadow-sm
            p-5
            "
          >
            <div className="text-3xl mb-3">🚗</div>

            <h3
              className="
              font-bold
              text-[#062A25]
              "
            >
              Développez votre activité
            </h3>

            <p
              className="
              text-sm
              text-gray-500
              mt-2
              "
            >
              Ajoutez votre véhicule et proposez vos trajets.
            </p>
          </div>

          <div
            className="
            bg-white
            rounded-3xl
            border
            shadow-sm
            p-5
            "
          >
            <div className="text-3xl mb-3">🔐</div>

            <h3
              className="
              font-bold
              text-[#062A25]
              "
            >
              Vérification sécurité
            </h3>

            <p
              className="
              text-sm
              text-gray-500
              mt-2
              "
            >
              Vos documents sont contrôlés avant validation.
            </p>
          </div>

          <div
            className="
            bg-white
            rounded-3xl
            border
            shadow-sm
            p-5
            "
          >
            <div className="text-3xl mb-3">📍</div>

            <h3
              className="
              font-bold
              text-[#062A25]
              "
            >
              Gestion facile
            </h3>

            <p
              className="
              text-sm
              text-gray-500
              mt-2
              "
            >
              Gérez vos véhicules depuis votre espace.
            </p>
          </div>
        </div>

        {
          /* ============================
            PROGRESSION
        ============================ */

          <div
            className="
          bg-white
          rounded-3xl
          border
          shadow-sm
          p-6
          mb-8
          "
          >
            <div
              className="
            flex
            justify-between
            text-sm
            font-semibold
            "
            >
              <span className={etape >= 1 ? "text-[#23C483]" : "text-gray-400"}>
                ① Véhicule
              </span>

              <span className={etape >= 2 ? "text-[#23C483]" : "text-gray-400"}>
                ② Documents
              </span>

              <span className={etape >= 3 ? "text-[#23C483]" : "text-gray-400"}>
                ③ Photos
              </span>
            </div>

            <div
              className="
            flex
            gap-2
            mt-4
            "
            >
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className={`
                h-2
                flex-1
                rounded-full

                ${n <= etape ? "bg-[#23C483]" : "bg-gray-200"}

                `}
                />
              ))}
            </div>
          </div>
        }

        {/* ============================
            FORMULAIRE
        ============================ */}

        <div
          className="
          bg-white
          rounded-3xl
          shadow-xl
          border
          p-8
          "
        >
          {erreur && (
            <div
              className="
              mb-6
              flex
              gap-3
              bg-orange-50
              border
              border-orange-200
              text-orange-800
              rounded-xl
              px-4
              py-3
              text-sm
              "
            >
              <span>⚠️</span>

              <p>{erreur}</p>
            </div>
          )}

          {/* ============================
              ETAPE 1
          ============================ */}

          {etape === 1 && (
            <div
              className="
              space-y-6
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
                  🚗 Informations du véhicule
                </h2>

                <p
                  className="
                  text-gray-500
                  text-sm
                  mt-1
                  "
                >
                  Décrivez votre véhicule.
                </p>
              </div>{" "}
              {/* CHAMPS VEHICULE */}
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="label">Type de véhicule</label>

                  <select
                    name="type_vehicule"
                    value={donnees.type_vehicule}
                    onChange={modifierChamp}
                    className="input"
                  >
                    <option value="taxi_brousse">🚐 Taxi-brousse</option>

                    <option value="voiture_privee">🚗 Voiture privée</option>

                    <option value="autocar">🚌 Autocar</option>
                  </select>
                </div>

                <div>
                  <label className="label">Carburant</label>

                  <select
                    name="type_carburant"
                    value={donnees.type_carburant}
                    onChange={modifierChamp}
                    className="input"
                  >
                    <option value="diesel">Diesel</option>

                    <option value="essence">Essence</option>
                  </select>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="label">Marque</label>

                  <input
                    name="marque"
                    value={donnees.marque}
                    onChange={modifierChamp}
                    placeholder="Toyota"
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Modèle</label>

                  <input
                    name="modele"
                    value={donnees.modele}
                    onChange={modifierChamp}
                    placeholder="Hiace"
                    className="input"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-5">
                <div>
                  <label className="label">Année</label>
                  <select
                    name="annee"
                    value={donnees.annee}
                    onChange={modifierChamp}
                    className="input"
                  >
                    <option value="">Sélectionner l'année</option>
                    {anneesVehicule.map((annee) => (
                      <option key={annee} value={annee}>
                        {annee}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Couleur</label>

                  <input
                    name="couleur"
                    value={donnees.couleur}
                    onChange={modifierChamp}
                    placeholder="Blanc"
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Places</label>

                  <input
                    type="number"
                    name="nombre_places"
                    value={donnees.nombre_places}
                    onChange={modifierChamp}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="label">Immatriculation</label>

                <input
                  name="immatriculation"
                  value={donnees.immatriculation}
                  onChange={modifierChamp}
                  placeholder="1234 TAB"
                  className="input"
                />
              </div>
              <div>
                <label className="label">
                  Équipements
                  <span className="text-gray-400 font-normal">
                    {" "}
                    (facultatif)
                  </span>
                </label>

                <textarea
                  name="equipements"
                  value={donnees.equipements}
                  onChange={modifierChamp}
                  rows="3"
                  placeholder="Climatisation, WiFi..."
                  className="input"
                />
              </div>
              <div className="flex justify-end pt-5">
                <button
                  type="button"
                  onClick={suivant}
                  className="
                  btn-primary
                  "
                >
                  Continuer →
                </button>
              </div>
            </div>
          )}

          {/* ============================
              ETAPE 2 DOCUMENTS
          ============================ */}

          {etape === 2 && (
            <div className="space-y-6">
              <div>
                <h2
                  className="
                  text-2xl
                  font-bold
                  text-[#062A25]
                  "
                >
                  📄 Documents administratifs
                </h2>

                <p className="text-gray-500 text-sm mt-1">
                  Ces documents permettent la validation de votre véhicule.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="label">Numéro assurance</label>

                  <input
                    name="numero_assurance"
                    value={donnees.numero_assurance}
                    onChange={modifierChamp}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Expiration assurance</label>

                  <input
                    type="date"
                    name="date_expiration_assurance"
                    value={donnees.date_expiration_assurance}
                    onChange={modifierChamp}
                    min={dateDemain()}
                    className="input"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="label">Date visite technique</label>

                  <input
                    type="date"
                    name="date_visite_technique"
                    value={donnees.date_visite_technique}
                    onChange={modifierChamp}
                    max={dateAujourdHui()}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Expiration visite</label>

                  <input
                    type="date"
                    name="date_expiration_visite"
                    value={donnees.date_expiration_visite}
                    onChange={modifierChamp}
                    min={dateDemain()}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Coopérative</label>

                <input
                  name="cooperative"
                  value={donnees.cooperative}
                  onChange={modifierChamp}
                  className="input"
                />
              </div>

              <div className="flex justify-between pt-5">
                <button
                  type="button"
                  onClick={precedent}
                  className="btn-secondary"
                >
                  ← Retour
                </button>

                <button type="button" onClick={suivant} className="btn-primary">
                  Continuer →
                </button>
              </div>
            </div>
          )}

          {/* ============================
    ETAPE 3 DOCUMENTS + PHOTOS
============================ */}

          {etape === 3 && (
            <form onSubmit={soumettre} className="space-y-8">
              {/* DOCUMENTS */}

              <div>
                <h2
                  className="
text-2xl
font-bold
text-[#062A25]
"
                >
                  📄 Documents administratifs
                </h2>

                <p className="text-gray-500 text-sm mt-1">
                  Ajoutez les documents nécessaires à la validation.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                {/* Carte grise recto */}

                <div>
                  <label className="label">📄 Carte grise recto</label>

                  <input
                    type="file"
                    name="carte_grise_recto"
                    accept="image/*,.pdf"
                    onChange={modifierChamp}
                    className="file-input"
                  />
                </div>

                {/* Carte grise verso */}

                <div>
                  <label className="label">📄 Carte grise verso</label>

                  <input
                    type="file"
                    name="carte_grise_verso"
                    accept="image/*,.pdf"
                    onChange={modifierChamp}
                    className="file-input"
                  />
                </div>

                {/* Assurance */}

                <div>
                  <label className="label">🛡️ Attestation assurance</label>

                  <input
                    type="file"
                    name="attestation_assurance"
                    accept="image/*,.pdf"
                    onChange={modifierChamp}
                    className="file-input"
                  />
                </div>

                {/* Visite */}

                <div>
                  <label className="label">
                    🔧 Certificat visite technique
                  </label>

                  <input
                    type="file"
                    name="certificat_visite"
                    accept="image/*,.pdf"
                    onChange={modifierChamp}
                    className="file-input"
                  />
                </div>

                {/* Licence */}

                <div>
                  <label className="label">
                    📑 Licence transport
                    <span className="text-gray-400 font-normal">
                      (facultatif)
                    </span>
                  </label>

                  <input
                    type="file"
                    name="licence_transport"
                    accept="image/*,.pdf"
                    onChange={modifierChamp}
                    className="file-input"
                  />
                </div>
              </div>

              {/* PHOTOS VEHICULE */}

              <div className="pt-6 border-t">
                <h2
                  className="
text-2xl
font-bold
text-[#062A25]
"
                >
                  📷 Photos du véhicule
                </h2>

                <p className="text-gray-500 text-sm mt-1">
                  Ajoutez jusqu'à 4 photos.
                </p>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={ajouterPhotos}
                  className="file-input mt-4"
                />

                <div
                  className="
grid
grid-cols-2
md:grid-cols-4
gap-4
mt-5
"
                >
                  {donnees.photos.map((photo, index) => (
                    <div
                      key={index}
                      className="
relative
rounded-xl
overflow-hidden
bg-gray-100
"
                    >
                      <img
                        src={URL.createObjectURL(photo)}
                        alt="aperçu"
                        className="
w-full
h-28
object-cover
"
                      />

                      <button
                        type="button"
                        onClick={() => supprimerPhoto(index)}
                        className="
absolute
top-2
right-2
bg-red-500
text-white
rounded-full
w-7
h-7
"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* BOUTONS */}

              <div className="flex justify-between pt-6">
                <button
                  type="button"
                  onClick={precedent}
                  className="btn-secondary"
                >
                  ← Retour
                </button>

                <button type="submit" disabled={envoi} className="btn-primary">
                  {envoi ? "Enregistrement..." : "🚗 Ajouter mon véhicule"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
