import { useState } from "react";

import Navbar from "../../components/Navbar";

import HeroSection from "../../components/home/HeroSection";
import SearchBox from "../../components/home/SearchBox";
import UpcomingTrips from "../../components/home/UpcomingTrips";
import WhyMadaGo from "../../components/home/WhyMadaGo";
import Statistics from "../../components/home/Statistics";
import PastTrips from "../../components/home/PastTrips";
import SecuritySection from "../../components/home/SecuritySection";
import PaymentSection from "../../components/home/PaymentSection";
import FAQSection from "../../components/home/FAQSection";
import DriverCTA from "../../components/home/DriverCTA";
import HomeFooter from "../../components/home/HomeFooter";

import api from "../../api/axios";

export default function Accueil() {
  const [resultatsRecherche, setResultatsRecherche] = useState([]);

  const [rechercheEffectuee, setRechercheEffectuee] = useState(false);

  const [chargement, setChargement] = useState(false);

  const [erreur, setErreur] = useState("");

  /*
  ====================================
  Recherche flexible des trajets
  ====================================
  */

  const handleSearch = async (filtres) => {
    try {
      setChargement(true);

      setErreur("");

      setRechercheEffectuee(true);

      const response = await api.get("/trajets/");

      let trajets = response.data;

      // Recherche par départ uniquement

      if (filtres.depart) {
        trajets = trajets.filter((trajet) =>
          trajet.ville_depart
            ?.toLowerCase()
            .includes(filtres.depart.toLowerCase()),
        );
      }

      // Recherche par arrivée uniquement

      if (filtres.arrivee) {
        trajets = trajets.filter((trajet) =>
          trajet.ville_arrivee
            ?.toLowerCase()
            .includes(filtres.arrivee.toLowerCase()),
        );
      }

      // Recherche par date uniquement

      if (filtres.date) {
        trajets = trajets.filter(
          (trajet) => trajet.date_depart === filtres.date,
        );
      }

      setResultatsRecherche(trajets);
    } catch (error) {
      console.error("Erreur recherche trajet :", error);

      setErreur("Impossible de rechercher les trajets.");
    } finally {
      setChargement(false);
    }
  };

  return (
    <div
      className="
      min-h-screen
      bg-[#F8FAFC]
      "
    >
      {/* Navigation */}

      <Navbar />

      {/* Hero */}

      <HeroSection />

      {/* Recherche */}

      <SearchBox onSearch={handleSearch} />

      {/* Résultats recherche */}

      {rechercheEffectuee && (
        <section
          className="
          max-w-7xl
          mx-auto
          px-6
          py-12
          "
        >
          <div className="mb-8">
            <p
              className="
              text-[#23C483]
              uppercase
              text-sm
              font-semibold
              "
            >
              Résultats
            </p>

            <h2
              className="
              text-3xl
              font-bold
              text-[#062A25]
              mt-2
              "
            >
              Trajets trouvés
            </h2>
          </div>

          {chargement && <p>Recherche en cours...</p>}

          {erreur && (
            <p
              className="
              text-red-600
              "
            >
              {erreur}
            </p>
          )}

          {!chargement && resultatsRecherche.length === 0 && (
            <div
              className="
              bg-white
              rounded-3xl
              shadow
              p-8
              text-center
              text-gray-500
              "
            >
              Aucun trajet trouvé.
            </div>
          )}

          <div
            className="
            grid
            md:grid-cols-3
            gap-6
            "
          >
            {resultatsRecherche.map((trajet) => (
              <div
                key={trajet.id}
                className="
                bg-white
                rounded-3xl
                shadow-lg
                border
                border-[#23C483]/20
                p-6
                hover:-translate-y-1
                transition
                "
              >
                <div
                  className="
                  inline-block
                  bg-[#E8F8F1]
                  text-[#008F65]
                  px-3
                  py-1
                  rounded-full
                  text-xs
                  font-semibold
                  "
                >
                  Disponible
                </div>

                <h3
                  className="
                  mt-5
                  text-xl
                  font-bold
                  text-[#062A25]
                  "
                >
                  {trajet.ville_depart}

                  {" → "}

                  {trajet.ville_arrivee}
                </h3>

                <div
                  className="
                  mt-4
                  text-gray-500
                  space-y-2
                  "
                >
                  <p>📅 {trajet.date_depart}</p>

                  <p>🕒 {trajet.heure_depart}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Trajets disponibles */}

      <UpcomingTrips />

      {/* Présentation MadaGo */}

      <WhyMadaGo />

      {/* Statistiques */}

      <Statistics />

      {/* Historique */}

      <PastTrips />

      {/* Sécurité */}

      <SecuritySection />

      {/* Paiement */}

      <PaymentSection />

      {/* FAQ */}

      <FAQSection />

      {/* Conducteurs */}

      <DriverCTA />

      {/* Footer */}

      <HomeFooter />
    </div>
  );
}
