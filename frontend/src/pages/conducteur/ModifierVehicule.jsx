import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import Navbar from "../../components/Navbar";

export default function ModifierVehicule() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ============================
  // ETATS
  // ============================

  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);

  const [etape, setEtape] = useState(1);

  const [erreur, setErreur] = useState("");
  const [messageSucces, setMessageSucces] = useState("");

  const [vehiculeInitial, setVehiculeInitial] = useState(null);

  const [donnees, setDonnees] = useState({
    type_vehicule: "",
    marque: "",
    modele: "",
    annee: "",
    couleur: "",
    immatriculation: "",
    nombre_places: "",
    type_carburant: "",
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

  const [documentsActuels, setDocumentsActuels] = useState({});

  // ============================
  // DATES
  // ============================

  const aujourd_hui = new Date().toISOString().split("T")[0];

  const dateDemain = () => {
    const date = new Date();

    date.setDate(date.getDate() + 1);

    return date.toISOString().split("T")[0];
  };

  // ============================
  // ANNEES VEHICULE
  // ============================

  const anneeActuelle = new Date().getFullYear();

  const anneesVehicule = Array.from(
    {
      length: anneeActuelle - 1995 + 1,
    },
    (_, index) => anneeActuelle - index,
  );

  // ============================
  // CHARGEMENT VEHICULE
  // ============================

  useEffect(() => {
    const chargerVehicule = async () => {
      try {
        const res = await api.get(`/vehicules/${id}/`);

        const v = res.data;

        setVehiculeInitial(v);

        setDonnees({
          type_vehicule: v.type_vehicule || "",

          marque: v.marque || "",

          modele: v.modele || "",

          annee: v.annee || "",

          couleur: v.couleur || "",

          immatriculation: v.immatriculation || "",

          nombre_places: v.nombre_places || "",

          type_carburant: v.type_carburant || "",

          equipements: v.equipements || "",

          numero_assurance: v.numero_assurance || "",

          date_expiration_assurance: v.date_expiration_assurance || "",

          date_visite_technique: v.date_visite_technique || "",

          date_expiration_visite: v.date_expiration_visite || "",

          numero_licence: v.numero_licence || "",

          cooperative: v.cooperative || "",

          zone_exploitation: v.zone_exploitation || "",

          carte_grise_recto: null,

          carte_grise_verso: null,

          attestation_assurance: null,

          certificat_visite: null,

          licence_transport: null,

          photos: [],
        });

        setDocumentsActuels({
          carte_grise_recto: v.carte_grise_recto,

          carte_grise_verso: v.carte_grise_verso,

          attestation_assurance: v.attestation_assurance,

          certificat_visite: v.certificat_visite,

          licence_transport: v.licence_transport,
        });
      } catch (error) {
        setErreur("Impossible de charger le véhicule.");
      } finally {
        setChargement(false);
      }
    };

    chargerVehicule();
  }, [id]);

  // ============================
  // MODIFICATION CHAMPS
  // ============================

  const modifierChamp = (e) => {
    const { name, value, files } = e.target;

    if (files) {
      setDonnees({
        ...donnees,

        [name]: files[0],
      });
    } else {
      setDonnees({
        ...donnees,

        [name]: value,
      });
    }
  };

  // ============================
  // PHOTOS
  // ============================

  const ajouterPhotos = (e) => {
    const fichiers = Array.from(e.target.files);

    const nouvellesPhotos = [...donnees.photos, ...fichiers].slice(0, 4);

    setDonnees({
      ...donnees,

      photos: nouvellesPhotos,
    });
  };

  const supprimerPhoto = (index) => {
    setDonnees({
      ...donnees,

      photos: donnees.photos.filter((_, i) => i !== index),
    });
  };

  // ============================
  // VALIDATION ETAPES
  // ============================

  const validerEtape1 = () => {
    if (!donnees.marque.trim()) {
      setErreur("Veuillez renseigner la marque.");

      return false;
    }

    if (!donnees.immatriculation.trim()) {
      setErreur("Veuillez renseigner l'immatriculation.");

      return false;
    }

    setErreur("");

    return true;
  };

  const validerEtape2 = () => {
    if (!donnees.numero_assurance.trim()) {
      setErreur("Le numéro d'assurance est obligatoire.");

      return false;
    }

    if (!donnees.date_expiration_assurance) {
      setErreur("La date d'expiration assurance est obligatoire.");

      return false;
    }

    if (donnees.date_expiration_assurance <= aujourd_hui) {
      setErreur("L'assurance doit expirer à partir de demain.");

      return false;
    }

    if (!donnees.date_visite_technique) {
      setErreur("La date de visite technique est obligatoire.");

      return false;
    }

    if (donnees.date_visite_technique > aujourd_hui) {
      setErreur("La visite technique ne peut pas être dans le futur.");

      return false;
    }

    setErreur("");

    return true;
  };

  // ============================
  // SOUMISSION
  // ============================

  const soumettre = async (e) => {
    e.preventDefault();

    setErreur("");

    setEnvoi(true);

    try {
      const formData = new FormData();

      Object.keys(donnees).forEach((cle) => {
        if (cle === "photos") {
          donnees.photos.forEach((photo) => formData.append("photos", photo));
        } else if (donnees[cle] !== null && donnees[cle] !== "") {
          formData.append(cle, donnees[cle]);
        }
      });

      const res = await api.put(`/vehicules/${id}/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMessageSucces(res.data.message || "Véhicule modifié avec succès.");
    } catch (error) {
      setErreur("Une erreur est survenue lors de la modification.");
    } finally {
      setEnvoi(false);
    }
  };

  const suivant = () => {
    if (etape === 1 && validerEtape1()) {
      setEtape(2);
    } else if (etape === 2 && validerEtape2()) {
      setEtape(3);
    }
  };

  const precedent = () => {
    if (etape > 1) {
      setEtape(etape - 1);
    }
  }; // ============================
  // AFFICHAGE CHARGEMENT
  // ============================

  if (chargement) {
    return (
      <div
        className="
        min-h-screen
        bg-gray-50
        flex
        items-center
        justify-center
        "
      >
        <div
          className="
          text-center
          "
        >
          <div
            className="
            text-5xl
            mb-4
            "
          >
            🚗
          </div>

          <p
            className="
            text-gray-600
            "
          >
            Chargement du véhicule...
          </p>
        </div>
      </div>
    );
  }

  // ============================
  // SUCCES
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
          <div
            className="
            text-6xl
            mb-5
            "
          >
            ✅
          </div>

          <h1
            className="
            text-3xl
            font-bold
            text-[#062A25]
            mb-4
            "
          >
            Modification réussie
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
            Retour à mes véhicules
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
        {/* HEADER */}

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
            Modifier votre véhicule 🚗
          </h1>

          <p
            className="
text-gray-500
mt-3
text-lg
"
          >
            Mettez à jour les informations de votre véhicule MadaGo.
          </p>
        </div>

        {/* STATUT VEHICULE */}

        <div
          className="
bg-white
rounded-3xl
border
shadow-sm
p-5
mb-8
"
        >
          <h3
            className="
font-bold
text-[#062A25]
"
          >
            Statut actuel du véhicule
          </h3>

          <p
            className="
text-gray-600
mt-2
"
          >
            {vehiculeInitial?.statut_validation === "valide"
              ? "🟢 Véhicule validé"
              : "🟠 Véhicule en attente de validation"}
          </p>
        </div>

        {/* PROGRESSION */}

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
              ① Informations
            </span>

            <span className={etape >= 2 ? "text-[#23C483]" : "text-gray-400"}>
              ② Administratif
            </span>

            <span className={etape >= 3 ? "text-[#23C483]" : "text-gray-400"}>
              ③ Documents
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

        {/* FORMULAIRE */}

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
bg-orange-50
border
border-orange-200
text-orange-800
rounded-xl
px-4
py-3
mb-6
text-sm
"
            >
              ⚠️ {erreur}
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
              <h2
                className="
text-2xl
font-bold
text-[#062A25]
"
              >
                🚗 Informations du véhicule
              </h2>
              <div
                className="
grid
md:grid-cols-2
gap-5
"
              >
                <div>
                  <label className="label">Type véhicule</label>

                  <select
                    name="type_vehicule"
                    value={donnees.type_vehicule}
                    onChange={modifierChamp}
                    className="input"
                  >
                    <option value="taxi_brousse">Taxi-brousse</option>

                    <option value="voiture_privee">Voiture privée</option>

                    <option value="autocar">Autocar</option>
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
              </div>{" "}
              {/* FIN ETAPE 1 */}
              <div className="flex justify-end pt-6">
                <button
                  type="button"
                  onClick={suivant}
                  className="
          bg-[#062A25]
          text-white
          px-6
          py-3
          rounded-xl
          font-semibold
          hover:bg-[#041D19]
          transition
          "
                >
                  Continuer →
                </button>
              </div>
            </div>
          )}

          {/* ============================
    ETAPE 2 ADMINISTRATIF
============================ */}

          {etape === 2 && (
            <div className="space-y-6">
              <h2
                className="
text-2xl
font-bold
text-[#062A25]
"
              >
                📋 Informations administratives
              </h2>

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
                    max={aujourd_hui}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Expiration visite technique</label>

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

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="label">Numéro licence</label>

                  <input
                    name="numero_licence"
                    value={donnees.numero_licence}
                    onChange={modifierChamp}
                    className="input"
                  />
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
              </div>

              <div>
                <label className="label">Zone exploitation</label>

                <input
                  name="zone_exploitation"
                  value={donnees.zone_exploitation}
                  onChange={modifierChamp}
                  className="input"
                />
              </div>

              <div className="flex justify-between pt-6">
                <button
                  type="button"
                  onClick={precedent}
                  className="
bg-gray-200
text-gray-700
px-6
py-3
rounded-xl
font-semibold
"
                >
                  ← Retour
                </button>

                <button
                  type="button"
                  onClick={suivant}
                  className="
bg-[#062A25]
text-white
px-6
py-3
rounded-xl
font-semibold
"
                >
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
              <h2
                className="
text-2xl
font-bold
text-[#062A25]
"
              >
                📄 Documents et photos
              </h2>

              {/* DOCUMENTS */}

              <div
                className="
grid
md:grid-cols-2
gap-5
"
              >
                {[
                  {
                    nom: "carte_grise_recto",
                    titre: "Carte grise recto",
                  },

                  {
                    nom: "carte_grise_verso",
                    titre: "Carte grise verso",
                  },

                  {
                    nom: "attestation_assurance",
                    titre: "Attestation assurance",
                  },

                  {
                    nom: "certificat_visite",
                    titre: "Certificat visite technique",
                  },

                  {
                    nom: "licence_transport",
                    titre: "Licence transport",
                  },
                ].map((doc) => (
                  <div
                    key={doc.nom}
                    className="
bg-gray-50
rounded-2xl
p-4
"
                  >
                    <label className="label">📄 {doc.titre}</label>

                    <input
                      type="file"
                      name={doc.nom}
                      accept="image/*,.pdf"
                      onChange={modifierChamp}
                      className="file-input"
                    />

                    {documentsActuels[doc.nom] && (
                      <p
                        className="
text-sm
text-green-700
mt-2
"
                      >
                        ✓ Document actuel disponible
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* PHOTOS */}

              <div
                className="
border-t
pt-6
"
              >
                <h3
                  className="
text-xl
font-bold
text-[#062A25]
mb-3
"
                >
                  📷 Photos du véhicule
                </h3>

                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={ajouterPhotos}
                  className="file-input"
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
"
                    >
                      <img
                        src={URL.createObjectURL(photo)}
                        alt="photo véhicule"
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

              <div className="flex justify-between pt-6">
                <button
                  type="button"
                  onClick={precedent}
                  className="
bg-gray-200
text-gray-700
px-6
py-3
rounded-xl
font-semibold
"
                >
                  ← Retour
                </button>

                <button
                  type="submit"
                  disabled={envoi}
                  className="
bg-[#062A25]
text-white
px-6
py-3
rounded-xl
font-semibold
hover:bg-[#041D19]
"
                >
                  {envoi
                    ? "Enregistrement..."
                    : "💾 Enregistrer les modifications"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
