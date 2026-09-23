import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
//import MessageErreur from "../../components/MessageErreur";
import api from "../../api/axios";

//import logoMadaGo from '../../assets/images/logoMadaGo.png'

export default function InscriptionConducteur() {
  const navigate = useNavigate();

  const { profilConducteur, setProfilConducteur } = useAuth();

  const [etape, setEtape] = useState(1);

  const [erreur, setErreur] = useState("");

  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    if (profilConducteur) {
      navigate("/conducteur");
    }
  }, [profilConducteur, navigate]);

  const [donnees, setDonnees] = useState({
    date_naissance: "",
    lieu_naissance: "",

    numero_cin: "",

    cin_recto: null,
    cin_verso: null,

    numero_permis: "",
    categorie_permis: "",

    permis_recto: null,
    permis_verso: null,

    contact_urgence_nom: "",
    contact_urgence_telephone: "",

    operateur_mobile_money: "mvola",

    numero_mobile_money: "",

    titulaire_mobile_money: "",
  });

  // Limite d'âge : minimum 18 ans

  const dateMaxNaissance = () => {
    const aujourdHui = new Date();

    aujourdHui.setFullYear(aujourdHui.getFullYear() - 18);

    return aujourdHui.toISOString().split("T")[0];
  };

  const modifierChamp = (e) => {
    const { name, value, files } = e.target;

    setDonnees({
      ...donnees,

      [name]: files ? files[0] : value,
    });
  };

  // const modifierChamp = (e) => {
  //   const { name, value, files } = e.target;

  //   setDonnees({
  //     ...donnees,

  //     [name]: files ? files[0] : value,
  //   });
  // };

  // Vérification avant passage étape suivante

  const verifierEtape = () => {
    if (etape === 1) {
      if (
        !donnees.date_naissance ||
        !donnees.lieu_naissance ||
        !donnees.numero_cin ||
        !donnees.cin_recto ||
        !donnees.cin_verso
      ) {
        setErreur(
          "Veuillez compléter toutes les informations d'identité avant de continuer.",
        );

        return false;
      }
      // Vérification âge minimum 18 ans

      const naissance = new Date(donnees.date_naissance);

      const limiteAge = new Date();

      limiteAge.setFullYear(limiteAge.getFullYear() - 18);

      if (naissance > limiteAge) {
        setErreur("Vous devez avoir au moins 18 ans pour devenir conducteur.");

        return false;
      }
    }

    if (etape === 2) {
      if (
        !donnees.numero_permis ||
        !donnees.categorie_permis ||
        !donnees.permis_recto ||
        !donnees.permis_verso
      ) {
        setErreur(
          "Veuillez compléter les informations du permis avant de continuer.",
        );

        return false;
      }
    }

    setErreur("");

    return true;
  };

  const suivant = () => {
    if (verifierEtape()) {
      setEtape(etape + 1);
    }
  };

  const precedent = () => {
    setErreur("");

    setEtape(etape - 1);
  };

  const soumettre = async (e) => {
    e.preventDefault();

    setErreur("");

    setEnvoi(true);

    const formData = new FormData();

    Object.entries(donnees).forEach(([cle, valeur]) => {
      if (valeur !== null && valeur !== "") {
        formData.append(cle, valeur);
      }
    });

    try {
      const res = await api.post("/devenir-conducteur/", formData, {
        headers: {
          "Content-Type": undefined,
        },
      });

      setProfilConducteur(res.data.conducteur);

      navigate("/conducteur");
    } catch (err) {
      console.error(err);

      setErreur(
        "Certaines informations sont incomplètes. Vérifiez votre formulaire.",
      );
    } finally {
      setEnvoi(false);
    }
  };
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
        py-10
        pt-32
        pb-10
        "
      >
        {/* ==========================
            PRESENTATION
        =========================== */}

        <div
          className="
          text-center
          mb-10
          "
        >
          {/* 
          <img

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
            text-3xl
            md:text-4xl
            font-bold
            text-[#062A25]
            leading-tight
            "
          >
            Devenez conducteur MadaGo 🚗
          </h1>

          <p
            className="
            text-gray-500
            mt-4
            text-lg
            "
          >
            Rejoignez notre réseau de transport et développez votre activité
            avec une plateforme simple et sécurisée.
          </p>
        </div>

        {/* ==========================
            AVANTAGES STATIQUES
        =========================== */}

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
            p-6
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
              Proposez vos trajets aux voyageurs MadaGo.
            </p>
          </div>

          <div
            className="
            bg-white
            rounded-3xl
            border
            shadow-sm
            p-6
            "
          >
            <div className="text-3xl mb-3">🔐</div>

            <h3
              className="
              font-bold
              text-[#062A25]
              "
            >
              Sécurité renforcée
            </h3>

            <p
              className="
              text-sm
              text-gray-500
              mt-2
              "
            >
              Les informations sont vérifiées pour protéger les voyageurs.
            </p>
          </div>

          <div
            className="
            bg-white
            rounded-3xl
            border
            shadow-sm
            p-6
            "
          >
            <div className="text-3xl mb-3">📍</div>

            <h3
              className="
              font-bold
              text-[#062A25]
              "
            >
              Gestion simplifiée
            </h3>

            <p
              className="
              text-sm
              text-gray-500
              mt-2
              "
            >
              Gérez votre activité depuis votre espace conducteur.
            </p>
          </div>
        </div>

        {/* ==========================
            PROGRESSION
        =========================== */}

        <div
          className="
          bg-white
          rounded-3xl
          shadow-sm
          border
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
              ① Identité
            </span>

            <span className={etape >= 2 ? "text-[#23C483]" : "text-gray-400"}>
              ② Permis
            </span>

            <span className={etape >= 3 ? "text-[#23C483]" : "text-gray-400"}>
              ③ Validation
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

        {/* ==========================
            FORMULAIRE PRINCIPAL
        =========================== */}

        <div
          className="
          bg-white
          rounded-3xl
          shadow-xl
          border
          border-gray-100
          p-8
          "
        >
          {/* MESSAGE ERREUR DISCRET */}

          {erreur && (
            <div
              className="
              mb-6
              flex
              items-start
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

          {/* Les étapes du formulaire vont ici */}

          {/* ==========================
              ETAPE 1 : IDENTITE
          =========================== */}

          {etape === 1 && (
            <div className="space-y-6">
              <h2
                className="
                text-2xl
                font-bold
                text-[#062A25]
                "
              >
                🪪 Informations personnelles
              </h2>

              <p className="text-gray-500 text-sm">
                Ces informations permettent à MadaGo de vérifier votre identité.
              </p>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="label">Date de naissance</label>

                  <input
                    type="date"
                    name="date_naissance"
                    value={donnees.date_naissance}
                    onChange={modifierChamp}
                    max={dateMaxNaissance()}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Lieu de naissance</label>

                  <input
                    name="lieu_naissance"
                    value={donnees.lieu_naissance}
                    onChange={modifierChamp}
                    placeholder="Antananarivo"
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Numéro CIN</label>

                <input
                  name="numero_cin"
                  value={donnees.numero_cin}
                  onChange={modifierChamp}
                  placeholder="Votre numéro CIN"
                  className="input"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="label">📄 CIN Recto</label>

                  <input
                    type="file"
                    name="cin_recto"
                    accept="image/*"
                    onChange={modifierChamp}
                    className="file-input"
                  />

                  {donnees.cin_recto && (
                    <p className="file-success">✓ {donnees.cin_recto.name}</p>
                  )}
                </div>

                <div>
                  <label className="label">📄 CIN Verso</label>

                  <input
                    type="file"
                    name="cin_verso"
                    accept="image/*"
                    onChange={modifierChamp}
                    className="file-input"
                  />

                  {donnees.cin_verso && (
                    <p className="file-success">✓ {donnees.cin_verso.name}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button type="button" onClick={suivant} className="btn-primary">
                  Continuer →
                </button>
              </div>
            </div>
          )}

          {/* ==========================
              ETAPE 2 : PERMIS
          =========================== */}

          {etape === 2 && (
            <div className="space-y-6">
              <h2
                className="
                text-2xl
                font-bold
                text-[#062A25]
                "
              >
                🚗 Informations permis
              </h2>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="label">Numéro permis</label>

                  <input
                    name="numero_permis"
                    value={donnees.numero_permis}
                    onChange={modifierChamp}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Catégorie permis</label>

                  <input
                    name="categorie_permis"
                    value={donnees.categorie_permis}
                    onChange={modifierChamp}
                    placeholder="Ex : B"
                    className="input"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="label">📄 Permis Recto</label>

                  <input
                    type="file"
                    name="permis_recto"
                    accept="image/*"
                    onChange={modifierChamp}
                    className="file-input"
                  />

                  {donnees.permis_recto && (
                    <p className="file-success">
                      ✓ {donnees.permis_recto.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="label">📄 Permis Verso</label>

                  <input
                    type="file"
                    name="permis_verso"
                    accept="image/*"
                    onChange={modifierChamp}
                    className="file-input"
                  />

                  {donnees.permis_verso && (
                    <p className="file-success">
                      ✓ {donnees.permis_verso.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-4">
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

          {/* ==========================
              ETAPE 3 : VALIDATION
          =========================== */}

          {etape === 3 && (
            <form onSubmit={soumettre} className="space-y-6">
              <h2
                className="
                text-2xl
                font-bold
                text-[#062A25]
                "
              >
                🆘 Contact d'urgence
              </h2>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="label">Nom du contact</label>

                  <input
                    name="contact_urgence_nom"
                    value={donnees.contact_urgence_nom}
                    onChange={modifierChamp}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Téléphone contact</label>

                  <input
                    name="contact_urgence_telephone"
                    value={donnees.contact_urgence_telephone}
                    onChange={modifierChamp}
                    className="input"
                  />
                </div>
              </div>

              <h2
                className="
                text-2xl
                font-bold
                text-[#062A25]
                "
              >
                💳 Paiement Mobile Money
              </h2>

              <select
                name="operateur_mobile_money"
                value={donnees.operateur_mobile_money}
                onChange={modifierChamp}
                className="input"
              >
                <option value="mvola">MVola</option>

                <option value="orange_money">Orange Money</option>

                <option value="airtel_money">Airtel Money</option>
              </select>

              <div className="grid md:grid-cols-2 gap-5">
                <input
                  name="numero_mobile_money"
                  value={donnees.numero_mobile_money}
                  onChange={modifierChamp}
                  placeholder="Numéro Mobile Money"
                  className="input"
                />

                <input
                  name="titulaire_mobile_money"
                  value={donnees.titulaire_mobile_money}
                  onChange={modifierChamp}
                  placeholder="Nom du titulaire"
                  className="input"
                />
              </div>

              <div
                className="
                bg-gray-50
                rounded-xl
                p-4
                text-sm
                text-gray-600
                "
              >
                🔐 Vos informations seront vérifiées par MadaGo avant
                validation.
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={precedent}
                  className="btn-secondary"
                >
                  ← Retour
                </button>

                <button type="submit" disabled={envoi} className="btn-primary">
                  {envoi ? "Envoi..." : "🚗 Envoyer ma demande"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
