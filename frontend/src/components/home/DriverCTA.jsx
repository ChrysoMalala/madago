import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function DriverCTA() {
  const { utilisateur } = useAuth();

  const lienConducteur = () => {
    if (!utilisateur) {
      return "/connexion";
    }

    if (utilisateur.est_conducteur) {
      return "/conducteur";
    }

    return "/conducteur/inscription";
  };

  return (
    <section
      className="
      max-w-7xl
      mx-auto
      px-6
      pb-24
      "
    >
      <div
        className="
        relative
        overflow-hidden
        rounded-[2rem]
        bg-gradient-to-r
        from-[#23C483]
        to-[#008F65]
        px-8
        py-14
        md:px-16
        text-center
        "
      >
        {/* Décoration */}

        <div
          className="
          absolute
          -top-20
          -right-20
          w-64
          h-64
          rounded-full
          bg-white/10
          "
        />

        <div
          className="
          absolute
          -bottom-20
          -left-20
          w-64
          h-64
          rounded-full
          bg-white/10
          "
        />

        <div
          className="
          relative
          "
        >
          <h2
            className="
            text-3xl
            md:text-4xl
            font-bold
            text-white
            "
          >
            Vous avez un véhicule ?
          </h2>

          <p
            className="
            mt-5
            max-w-2xl
            mx-auto
            text-white/90
            leading-relaxed
            "
          >
            Rejoignez MadaGo et proposez vos trajets aux voyageurs partout à
            Madagascar. Développez votre activité avec une plateforme simple et
            sécurisée.
          </p>

          <div
            className="
            mt-8
            flex
            flex-col
            sm:flex-row
            justify-center
            gap-4
            "
          >
            <Link
              to={lienConducteur()}
              className="
              bg-white
              text-[#008F65]
              px-8
              py-3
              rounded-xl
              font-bold
              hover:bg-gray-100
              transition
              "
            >
              Devenir conducteur
            </Link>

            <a
              href="#recherche"
              className="
              border
              border-white/60
              text-white
              px-8
              py-3
              rounded-xl
              font-semibold
              hover:bg-white/10
              transition
              "
            >
              Trouver un trajet
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
