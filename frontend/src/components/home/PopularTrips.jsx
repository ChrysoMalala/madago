import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../../api/axios";
import Spinner from "../Spinner";
import MessageErreur from "../MessageErreur";

export default function PopularTrips() {
  const [trajets, setTrajets] = useState([]);

  const [chargement, setChargement] = useState(true);

  const [erreur, setErreur] = useState("");

  useEffect(() => {
    const chargerTrajets = async () => {
      try {
        const response = await api.get("/trajets/");

        // On garde uniquement quelques trajets
        // pour la présentation d'accueil

        setTrajets(response.data.slice(0, 6));
      } catch (error) {
        console.error(error);

        setErreur("Impossible de charger les trajets disponibles.");
      } finally {
        setChargement(false);
      }
    };

    chargerTrajets();
  }, []);

  return (
    <section
      className="
      max-w-7xl
      mx-auto
      px-6
      py-24
      "
    >
      {/* Titre */}

      <div
        className="
        flex
        flex-col
        md:flex-row
        md:items-center
        md:justify-between
        gap-4
        mb-12
        "
      >
        <div>
          <p
            className="
            text-[#23C483]
            font-semibold
            uppercase
            tracking-wider
            text-sm
            "
          >
            Nos destinations
          </p>

          <h2
            className="
            mt-3
            text-3xl
            font-bold
            text-[#062A25]
            "
          >
            Trajets populaires
          </h2>
        </div>

        <Link
          to="/trajets"
          className="
          text-[#23C483]
          font-semibold
          hover:underline
          "
        >
          Voir tous les trajets →
        </Link>
      </div>

      {/* Contenu */}

      {chargement && <Spinner />}

      {erreur && <MessageErreur message={erreur} />}

      {!chargement && !erreur && trajets.length === 0 && (
        <div
          className="
          text-center
          py-12
          text-gray-500
          "
        >
          Aucun trajet disponible actuellement.
        </div>
      )}

      {!chargement && trajets.length > 0 && (
        <div
          className="
          grid
          sm:grid-cols-2
          lg:grid-cols-3
          gap-6
          "
        >
          {trajets.map((trajet) => (
            <Link
              key={trajet.id}
              to={`/trajets/${trajet.id}`}
              className="
              group
              bg-white
              rounded-3xl
              border
              border-gray-100
              p-6
              shadow-sm
              hover:shadow-xl
              hover:-translate-y-1
              transition
              "
            >
              {/* Ligne itinéraire */}

              <div
                className="
                flex
                items-center
                gap-3
                mb-6
                "
              >
                <span
                  className="
                  w-3
                  h-3
                  rounded-full
                  bg-[#C1440E]
                  "
                />

                <div
                  className="
                  flex-1
                  border-t
                  border-dashed
                  border-gray-300
                  "
                />

                <span
                  className="
                  text-xl
                  "
                >
                  🚐
                </span>

                <div
                  className="
                  flex-1
                  border-t
                  border-dashed
                  border-gray-300
                  "
                />

                <span
                  className="
                  w-3
                  h-3
                  rounded-full
                  bg-[#23C483]
                  "
                />
              </div>

              <h3
                className="
                text-xl
                font-bold
                text-[#062A25]
                group-hover:text-[#23C483]
                transition
                "
              >
                {trajet.ville_depart}

                {" → "}

                {trajet.ville_arrivee}
              </h3>

              <div
                className="
                mt-4
                space-y-2
                text-sm
                text-gray-500
                "
              >
                <p>📅 {trajet.date_depart}</p>

                <p>🕒 {trajet.heure_depart}</p>

                <p>📏 {trajet.distance_km} km</p>
              </div>

              <div
                className="
                mt-6
                flex
                justify-between
                items-center
                "
              >
                <span
                  className="
                  text-[#23C483]
                  font-bold
                  text-lg
                  "
                >
                  {trajet.prix_unique
                    ? `${trajet.prix_unique} Ar`
                    : "Tarif disponible"}
                </span>

                <span
                  className="
                  text-sm
                  text-gray-400
                  "
                >
                  Voir →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
