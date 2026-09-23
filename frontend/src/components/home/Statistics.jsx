const STATISTIQUES = [
  {
    valeur: "50 000+",
    titre: "Passagers transportés",
    description: "Des voyageurs utilisent MadaGo pour leurs déplacements.",
  },

  {
    valeur: "50+",
    titre: "Destinations desservies",
    description: "Des liaisons interurbaines partout à Madagascar.",
  },

  {
    valeur: "95%",
    titre: "Départs ponctuels",
    description: "Une meilleure organisation pour vos voyages.",
  },

  {
    valeur: "4.7/5",
    titre: "Satisfaction clients",
    description: "Une expérience appréciée par nos voyageurs.",
  },
];

export default function Statistics() {
  return (
    <section
      className="
      bg-[#062A25]
      py-20
      relative
      overflow-hidden
      "
    >
      {/* Décoration */}

      <div
        className="
        absolute
        -top-32
        right-0
        w-96
        h-96
        rounded-full
        bg-[#23C483]/20
        blur-3xl
        "
      />

      <div
        className="
        relative
        max-w-7xl
        mx-auto
        px-6
        "
      >
        <div
          className="
          grid
          grid-cols-2
          md:grid-cols-4
          gap-8
          "
        >
          {STATISTIQUES.map((stat) => (
            <div
              key={stat.titre}
              className="
              text-center
              "
            >
              <p
                className="
                text-4xl
                md:text-5xl
                font-bold
                text-[#23C483]
                "
              >
                {stat.valeur}
              </p>

              <h3
                className="
                mt-3
                text-white
                font-semibold
                text-lg
                "
              >
                {stat.titre}
              </h3>

              <p
                className="
                mt-2
                text-white/60
                text-sm
                leading-relaxed
                "
              >
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
