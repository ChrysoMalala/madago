import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../../api/axios";
import Spinner from "../Spinner";
import MessageErreur from "../MessageErreur";

export default function PastTrips() {
  const [trajets, setTrajets] = useState([]);

  const [chargement, setChargement] = useState(true);

  const [erreur, setErreur] = useState("");

  useEffect(() => {
    const chargerTrajetsPasses = async () => {
      try {
        const response = await api.get("/trajets/");

        const aujourdHui = new Date();

        const passes = response.data.filter((trajet) => {
          return new Date(trajet.date_depart) < aujourdHui;
        });

        setTrajets(passes.slice(0, 6));
      } catch (error) {
        console.error(error);

        setErreur("Impossible de charger l'historique des trajets.");
      } finally {
        setChargement(false);
      }
    };

    chargerTrajetsPasses();
  }, []);

  return (
    <section
      className="
      bg-[#062A25]
      py-20
      "
    >
      <div
        className="
        max-w-7xl
        mx-auto
        px-6
        "
      >
        {/* Titre */}

        <div
          className="
          mb-10
          "
        >
          <p
            className="
            text-[#23C483]
            uppercase
            tracking-wider
            text-sm
            font-semibold
            "
          >
            Historique
          </p>

          <h2
            className="
            mt-3
            text-3xl
            md:text-4xl
            font-bold
            text-white
            "
          >
            Trajets précédents
          </h2>

          <p
            className="
            mt-3
            text-white/60
            max-w-2xl
            "
          >
            Retrouvez les trajets déjà effectués et consultez votre historique
            de voyages.
          </p>
        </div>

        {chargement && <Spinner />}

        {erreur && <MessageErreur message={erreur} />}

        {!chargement && trajets.length === 0 && (
          <div
            className="
            bg-white/10
            border
            border-white/10
            rounded-3xl
            p-8
            text-center
            text-white/60
            "
          >
            Aucun trajet passé disponible.
          </div>
        )}

        <div
          className="
          grid
          md:grid-cols-3
          gap-6
          "
        >
          {trajets.map((trajet) => (
            <Link
              key={trajet.id}
              to={`/trajets/${trajet.id}`}
              className="

              bg-white/10

              backdrop-blur-sm

              border

              border-white/10

              rounded-3xl

              p-6

              opacity-90

              hover:opacity-100

              transition

              "
            >
              {/* Badge historique */}

              <div
                className="
                inline-flex
                items-center
                gap-2
                bg-white/10
                text-white/70
                px-3
                py-1
                rounded-full
                text-xs
                "
              >
                ✓ Trajet effectué
              </div>

              {/* Trajet */}

              <h3
                className="
                mt-6
                text-xl
                font-bold
                text-white
                "
              >
                {trajet.ville_depart}

                <span
                  className="
                  mx-2
                  text-white/50
                  "
                >
                  →
                </span>

                {trajet.ville_arrivee}
              </h3>

              {/* Informations */}

              <div
                className="
                mt-5
                space-y-2
                text-sm
                text-white/60
                "
              >
                <p>📅 {trajet.date_depart}</p>

                <p>🕒 {trajet.heure_depart}</p>
              </div>

              <div
                className="
                mt-6
                text-sm
                text-white/40
                "
              >
                Voir le détail →
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
