const AVANTAGES = [
  {
    icone: "🛡️",
    titre: "Sécurité maximale",
    texte:
      "Tous nos conducteurs et véhicules sont vérifiés avant validation. Votre sécurité est notre priorité absolue.",
  },

  {
    icone: "📱",
    titre: "Réservation en ligne facile",
    texte:
      "Réservez votre trajet en quelques clics depuis votre smartphone ou ordinateur.",
  },

  {
    icone: "💰",
    titre: "Tarifs transparents",
    texte:
      "Les prix sont affichés clairement avant la réservation, sans frais cachés.",
  },

  {
    icone: "🗺️",
    titre: "Réseau national étendu",
    texte:
      "Voyagez vers les principales villes et destinations touristiques de Madagascar.",
  },

  {
    icone: "🎧",
    titre: "Assistance 24/7",
    texte:
      "Notre équipe reste disponible pour répondre à vos questions avant et pendant votre voyage.",
  },

  {
    icone: "🚐",
    titre: "Confort à bord",
    texte:
      "Des véhicules adaptés pour vous offrir une expérience agréable pendant vos déplacements.",
  },

  {
    icone: "⏱️",
    titre: "Ponctualité garantie",
    texte:
      "Recevez les informations importantes concernant votre trajet et voyagez sereinement.",
  },

  {
    icone: "🌱",
    titre: "Engagement écologique",
    texte:
      "MadaGo accompagne une mobilité plus responsable et durable à Madagascar.",
  },
];

export default function WhyMadaGo() {
  return (
    <section
      id="pourquoi"
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
          Pourquoi choisir MadaGo ?
        </p>

        <h2
          className="
          mt-4
          text-4xl
          font-bold
          text-[#062A25]
          "
        >
          Votre partenaire de confiance pour voyager à Madagascar
        </h2>

        <p
          className="
          mt-5
          text-gray-500
          leading-relaxed
          "
        >
          Une solution moderne qui facilite la rencontre entre voyageurs et
          conducteurs tout en garantissant sécurité, transparence et confort.
        </p>
      </div>

      {/* Cartes avantages */}

      <div
        className="
        grid
        sm:grid-cols-2
        lg:grid-cols-4
        gap-6
        "
      >
        {AVANTAGES.map((avantage) => (
          <div
            key={avantage.titre}
            className="
            bg-white
            rounded-3xl
            p-6
            border
            border-gray-100
            shadow-sm
            hover:shadow-xl
            hover:-translate-y-1
            transition
            "
          >
            <div
              className="
              w-14
              h-14
              rounded-2xl
              bg-[#E8F8F1]
              flex
              items-center
              justify-center
              text-3xl
              mb-5
              "
            >
              {avantage.icone}
            </div>

            <h3
              className="
              text-lg
              font-bold
              text-[#062A25]
              mb-3
              "
            >
              {avantage.titre}
            </h3>

            <p
              className="
              text-gray-500
              text-sm
              leading-relaxed
              "
            >
              {avantage.texte}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
