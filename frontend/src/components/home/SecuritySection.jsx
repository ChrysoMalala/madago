const SECURITE = [
  {
    icone: "🚐",
    titre: "Véhicules contrôlés",
    texte:
      "Chaque véhicule publié sur MadaGo est vérifié afin de garantir un voyage plus sûr et plus confortable.",
  },

  {
    icone: "👨‍✈️",
    titre: "Chauffeurs qualifiés",
    texte:
      "Les conducteurs doivent fournir leurs documents et respecter les conditions de validation MadaGo.",
  },

  {
    icone: "🛡️",
    titre: "Assurance complète",
    texte:
      "Vos déplacements bénéficient d'une meilleure protection grâce à nos mesures de sécurité.",
  },

  {
    icone: "🎧",
    titre: "Assistance 24/7",
    texte:
      "Notre équipe reste disponible pour vous accompagner avant, pendant et après votre trajet.",
  },
];

export default function SecuritySection() {
  return (
    <section
      id="securite"
      className="
      bg-[#F8FAFC]
      py-24
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
          text-center
          max-w-3xl
          mx-auto
          mb-14
          "
        >
          <p
            className="
            text-[#23C483]
            font-semibold
            uppercase
            tracking-wider
            text-sm
            "
          >
            Votre sécurité avant tout
          </p>

          <h2
            className="
            mt-4
            text-4xl
            font-bold
            text-[#062A25]
            "
          >
            Nos mesures de sécurité
          </h2>

          <p
            className="
            mt-5
            text-gray-500
            "
          >
            MadaGo met en place plusieurs contrôles pour garantir une expérience
            de voyage fiable.
          </p>
        </div>

        {/* Cartes */}

        <div
          className="
          grid
          md:grid-cols-4
          gap-6
          "
        >
          {SECURITE.map((item) => (
            <div
              key={item.titre}
              className="
              bg-white
              rounded-3xl
              p-7
              border
              border-gray-100
              shadow-sm
              hover:shadow-xl
              hover:-translate-y-1
              transition
              text-center
              "
            >
              <div
                className="
                w-16
                h-16
                mx-auto
                rounded-2xl
                bg-[#E8F8F1]
                flex
                items-center
                justify-center
                text-4xl
                mb-6
                "
              >
                {item.icone}
              </div>

              <h3
                className="
                text-lg
                font-bold
                text-[#062A25]
                mb-3
                "
              >
                {item.titre}
              </h3>

              <p
                className="
                text-gray-500
                text-sm
                leading-relaxed
                "
              >
                {item.texte}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
