import { useState } from "react";

const FAQ = [
  {
    question: "Comment se passe le paiement ?",

    reponse:
      "Vous payez votre réservation avec les solutions Mobile Money disponibles à Madagascar (MVola, Orange Money ou Airtel Money). Le paiement est sécurisé selon le fonctionnement prévu par MadaGo.",
  },

  {
    question: "Que se passe-t-il si j'annule ma réservation ?",

    reponse:
      "L'annulation est possible selon les conditions prévues par MadaGo. Le remboursement dépend du moment où la demande d'annulation est effectuée avant le départ.",
  },

  {
    question: "Comment devenir conducteur sur MadaGo ?",

    reponse:
      "Créez votre compte conducteur, complétez votre profil, ajoutez vos documents et votre véhicule. Après validation par l'équipe MadaGo, vous pourrez publier vos trajets.",
  },

  {
    question: "MadaGo prend-il une commission ?",

    reponse:
      "Oui. Une commission est appliquée sur les réservations effectuées via la plateforme afin d'assurer le fonctionnement du service.",
  },

  {
    question: "Quels types de trajets sont disponibles ?",

    reponse:
      "MadaGo est spécialisé dans le transport interurbain à Madagascar avec des trajets longue distance entre différentes villes.",
  },
];

export default function FAQSection() {
  const [ouverte, setOuverte] = useState(null);

  return (
    <section
      className="
      max-w-5xl
      mx-auto
      px-6
      py-24
      "
    >
      {/* Titre */}

      <div
        className="
        text-center
        mb-12
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
          Besoin d'aide ?
        </p>

        <h2
          className="
          mt-4
          text-4xl
          font-bold
          text-[#062A25]
          "
        >
          Questions fréquentes
        </h2>

        <p
          className="
          mt-4
          text-gray-500
          "
        >
          Retrouvez les réponses aux questions les plus fréquentes concernant
          MadaGo.
        </p>
      </div>

      {/* Questions */}

      <div
        className="
        space-y-4
        "
      >
        {FAQ.map((item, index) => (
          <div
            key={item.question}
            className="
            bg-white
            border
            border-gray-100
            rounded-2xl
            overflow-hidden
            shadow-sm
            "
          >
            <button
              onClick={() => setOuverte(ouverte === index ? null : index)}
              className="
              w-full
              flex
              justify-between
              items-center
              px-6
              py-5
              text-left
              font-semibold
              text-[#062A25]
              hover:bg-gray-50
              transition
              "
            >
              <span>{item.question}</span>

              <span
                className="
                text-[#23C483]
                text-2xl
                "
              >
                {ouverte === index ? "−" : "+"}
              </span>
            </button>

            {ouverte === index && (
              <div
                className="
                px-6
                pb-6
                text-gray-500
                leading-relaxed
                "
              >
                {item.reponse}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
