import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import heroImage from "../../assets/images/aerial-landscape-crimea.jpg";

export default function HeroSection() {
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
      relative
      min-h-screen
      flex
      items-center
      overflow-hidden
      "
    >
      {/* Image arrière-plan */}

      <img
        src={heroImage}
        alt="Route Madagascar"
        className="
        absolute
        top-0
        left-0
        w-full
        h-[90%]
        object-cover
        "
      />

      {/* Overlay sombre pour lisibilité */}

      <div
        className="
        absolute
        inset-0
        bg-gradient-to-r
        from-black/75
        via-black/45
        to-black/20
        "
      />

      {/* Contenu */}

      <div
        className="
        relative
        z-10
        max-w-7xl
        mx-auto
        w-full
        px-6
        pt-24
        "
      >
        <div
          className="
          max-w-3xl
          "
        >
          {/* Badge */}

          <div
            className="
            inline-flex
            items-center
            gap-2
            bg-white/15
            backdrop-blur-md
            border
            border-white/20
            text-white
            px-5
            py-2
            rounded-full
            text-sm
            mb-6
            "
          >
            📍 Transport interurbain à Madagascar
          </div>

          {/* Titre */}

          <h1
            className="
            text-5xl
            md:text-7xl
            font-bold
            leading-tight
            text-white
            "
          >
            Voyagez plus loin,
            <span
              className="
              block
              text-[#23C483]
              "
            >
              simplement et en confiance
            </span>
          </h1>

          {/* Description */}

          <p
            className="
            mt-6
            text-lg
            md:text-xl
            text-white/85
            max-w-2xl
            leading-relaxed
            "
          >
            MadaGo connecte les voyageurs et les conducteurs pour faciliter vos
            déplacements entre les villes de Madagascar avec une réservation
            simple et sécurisée.
          </p>

          {/* Boutons */}

          <div
            className="
            mt-8
            flex
            flex-col
            sm:flex-row
            gap-4
            "
          >
            <a
              href="#recherche"
              className="
              bg-[#23C483]
              hover:bg-[#1aaa70]
              text-white
              px-8
              py-4
              rounded-xl
              font-bold
              transition
              flex
              items-center
              justify-center
              gap-2
              "
            >
              🔎 Rechercher un trajet
            </a>

            <Link
              to={lienConducteur()}
              className="
              bg-white/10
              backdrop-blur
              border
              border-white/40
              text-white
              px-8
              py-4
              rounded-xl
              font-semibold
              hover:bg-white/20
              transition
              flex
              items-center
              justify-center
              gap-2
              "
            >
              👤 Devenir conducteur
            </Link>
          </div>

          {/* Statistiques */}

          <div
            className="
            mt-12
            flex
            flex-wrap
            gap-8
            "
          >
            <div>
              <p
                className="
                text-3xl
                font-bold
                text-white
                "
              >
                50+
              </p>

              <p
                className="
                text-white/70
                "
              >
                Destinations
              </p>
            </div>

            <div
              className="
              border-l
              border-white/30
              pl-8
              "
            >
              <p
                className="
                text-3xl
                font-bold
                text-white
                "
              >
                50 000+
              </p>

              <p
                className="
                text-white/70
                "
              >
                Voyageurs
              </p>
            </div>

            <div
              className="
              border-l
              border-white/30
              pl-8
              "
            >
              <p
                className="
                text-3xl
                font-bold
                text-white
                "
              >
                95%
              </p>

              <p
                className="
                text-white/70
                "
              >
                Ponctualité
              </p>
            </div>

            <div
              className="
              border-l
              border-white/30
              pl-8
              "
            >
              <p
                className="
                text-3xl
                font-bold
                text-white
                "
              >
                4.7/5
              </p>

              <p
                className="
                text-white/70
                "
              >
                Satisfaction
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Indication bas écran */}

      <div
        className="
        absolute
        bottom-8
        left-1/2
        -translate-x-1/2
        text-white/80
        text-sm
        text-center
        "
      >
        ↓
        <br />
        Découvrir plus
      </div>
    </section>
  );
}
