import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Flag,
  CalendarDays,
  Clock3,
  User,
  Star,
  BriefcaseBusiness,
  ArrowRight,
} from "lucide-react";

import api from "../../api/axios";
import Spinner from "../Spinner";
import MessageErreur from "../MessageErreur";

export default function UpcomingTrips() {
  const [trajets, setTrajets] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    const chargerTrajets = async () => {
      try {
        const response = await api.get("/trajets/");

        const maintenant = new Date();

        const futurs = response.data.filter((trajet) => {
          const dateTrajet = new Date(
            `${trajet.date_depart}T${trajet.heure_depart || "00:00"}`
          );

          return dateTrajet >= maintenant;
        });

        setTrajets(futurs.slice(0, 3));
      } catch (error) {
        console.error(error);
        setErreur("Impossible de charger les prochains trajets.");
      } finally {
        setChargement(false);
      }
    };

    chargerTrajets();
  }, []);

  // Formatage de la date
  const formaterDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // Récupération des informations du véhicule
  const getVehicule = (trajet) => {
    return trajet.vehicule || {};
  };

  // Récupération du conducteur
  const getConducteur = (trajet) => {
    return trajet.conducteur || trajet.chauffeur || {};
  };

  return (
    <section className="max-w-7xl mx-auto px-6 py-20">

      {/* ================= TITRE ================= */}
      <div className="mb-10">
        <p className="text-[#23C483] font-semibold uppercase text-sm tracking-wider">
          Prochains voyages
        </p>

        <h2 className="mt-3 text-3xl md:text-4xl font-bold text-[#062A25]">
          Trajets disponibles prochainement
        </h2>

        <p className="mt-3 text-gray-500 max-w-2xl">
          Réservez votre place dès maintenant pour votre prochain déplacement
          à Madagascar.
        </p>
      </div>

      {/* ================= CHARGEMENT ================= */}
      {chargement && <Spinner />}

      {/* ================= ERREUR ================= */}
      {erreur && <MessageErreur message={erreur} />}

      {/* ================= AUCUN TRAJET ================= */}
      {!chargement && !erreur && trajets.length === 0 && (
        <div className="bg-white rounded-2xl border p-8 text-center text-gray-500">
          Aucun trajet disponible prochainement.
        </div>
      )}

      {/* ================= LISTE ================= */}
      {!chargement && trajets.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {trajets.map((trajet) => {
            const vehicule = getVehicule(trajet);
            const conducteur = getConducteur(trajet);

            return (
              <Link
                key={trajet.id}
                to={`/trajets/${trajet.id}`}
                className="
                  group
                  block
                  bg-white
                  rounded-2xl
                  border
                  border-gray-200
                  overflow-hidden
                  shadow-sm
                  hover:shadow-xl
                  hover:-translate-y-1
                  transition-all
                  duration-300
                "
              >

                {/* =====================================================
                    ITINÉRAIRE
                ====================================================== */}
                <div className="px-5 pt-5">

                  <div className="flex items-center gap-2 text-[15px] font-bold text-[#062A25]">

                    <div className="flex items-center gap-1.5 min-w-0">
                      <MapPin
                        size={16}
                        className="text-[#062A25] shrink-0"
                      />

                      <span className="truncate">
                        {trajet.ville_depart}
                      </span>
                    </div>

                    <ArrowRight
                      size={17}
                      className="text-gray-400 shrink-0"
                    />

                    <div className="flex items-center gap-1.5 min-w-0">
                      <Flag
                        size={16}
                        className="text-[#23C483] shrink-0"
                      />

                      <span className="truncate">
                        {trajet.ville_arrivee}
                      </span>
                    </div>

                  </div>
                </div>

                {/* =====================================================
                    DATE + HEURE
                ====================================================== */}
                <div className="
                  mx-4
                  mt-4
                  bg-gray-100
                  rounded-xl
                  flex
                  items-center
                  justify-between
                  px-3
                  py-3
                  text-xs
                  text-gray-600
                ">

                  <div className="flex items-center gap-2">
                    <CalendarDays size={15} />

                    <span className="font-medium">
                      {formaterDate(trajet.date_depart)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock3 size={15} />

                    <span className="font-bold text-[#062A25]">
                      {trajet.heure_depart}
                    </span>
                  </div>

                </div>

                {/* =====================================================
                    VÉHICULE
                ====================================================== */}
                <div className="px-4 mt-4">

                  <div className="flex items-center gap-3">

                    {/* Photo véhicule */}
                    <div className="
                      w-16
                      h-16
                      rounded-xl
                      overflow-hidden
                      bg-gray-100
                      shrink-0
                    ">
                      {vehicule.photo ? (
                        <img
                          src={vehicule.photo}
                          alt="Véhicule"
                          className="
                            w-full
                            h-full
                            object-cover
                            group-hover:scale-105
                            transition-transform
                          "
                        />
                      ) : (
                        <div className="
                          w-full
                          h-full
                          flex
                          items-center
                          justify-center
                          text-2xl
                        ">
                          🚐
                        </div>
                      )}
                    </div>

                    {/* Informations véhicule */}
                    <div className="flex-1 min-w-0">

                      <div className="flex items-center justify-between gap-2">

                        <h3 className="
                          font-semibold
                          text-[#062A25]
                          text-sm
                          truncate
                        ">
                          {vehicule.marque || "Véhicule"}
                          {vehicule.modele && ` - ${vehicule.modele}`}
                        </h3>

                        {/* Prix */}
                        <span className="
                          font-bold
                          text-[#23C483]
                          text-sm
                          whitespace-nowrap
                        ">
                          {trajet.prix_unique
                            ? `${Number(trajet.prix_unique).toLocaleString(
                                "fr-FR"
                              )} Ar`
                            : "Prix disponible"}
                        </span>

                      </div>

                      <p className="text-xs text-gray-500 mt-1">
                        {vehicule.annee
                          ? `${vehicule.annee} series`
                          : "Transport disponible"}
                      </p>

                      <div className="
                        flex
                        items-center
                        gap-4
                        mt-2
                        text-xs
                        text-gray-500
                      ">

                        <span className="flex items-center gap-1">
                          <User size={13} />
                          {vehicule.places ||
                            trajet.places_disponibles ||
                            "—"}{" "}
                          places
                        </span>

                        <span className="flex items-center gap-1">
                          <BriefcaseBusiness size={13} />
                          {trajet.politique_bagages || "Bagage simple"}
                        </span>

                      </div>
                    </div>

                  </div>
                </div>

                {/* =====================================================
                    CONDUCTEUR
                ====================================================== */}
                <div className="
                  mx-4
                  mt-4
                  mb-4
                  bg-gray-100
                  rounded-xl
                  px-3
                  py-3
                ">

                  <div className="flex items-center gap-3">

                    {/* Photo conducteur */}
                    <div className="
                      w-10
                      h-10
                      rounded-lg
                      overflow-hidden
                      bg-gray-200
                      shrink-0
                    ">

                      {conducteur.photo ? (
                        <img
                          src={conducteur.photo}
                          alt="Conducteur"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="
                          w-full
                          h-full
                          flex
                          items-center
                          justify-center
                          text-gray-500
                        ">
                          <User size={19} />
                        </div>
                      )}

                    </div>

                    {/* Nom conducteur */}
                    <div className="flex-1 min-w-0">

                      <p className="
                        text-sm
                        font-semibold
                        text-[#062A25]
                        truncate
                      ">
                        {conducteur.nom_complet ||
                          conducteur.nom ||
                          `${conducteur.prenom || ""} ${
                            conducteur.nom || ""
                          }`.trim() ||
                          "Conducteur"}
                      </p>

                      <div className="
                        flex
                        items-center
                        gap-1
                        mt-1
                        text-xs
                        text-gray-500
                      ">

                        <Star
                          size={12}
                          className="fill-current text-yellow-500"
                        />

                        <span>
                          {conducteur.note || "4.7"}
                        </span>

                        <span>•</span>

                        <span>
                          {conducteur.nombre_trajets ||
                            conducteur.trajets_realises ||
                            "2"}{" "}
                          trajets
                        </span>

                      </div>

                    </div>

                    {/* Voir plus */}
                    <span className="
                      text-[11px]
                      text-[#008F65]
                      underline
                      whitespace-nowrap
                    ">
                      Voir plus...
                    </span>

                  </div>

                </div>

              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}