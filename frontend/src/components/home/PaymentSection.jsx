import airtelLogo from "../../assets/payments/airtel-money.png";
import orangeLogo from "../../assets/payments/orange-money.png";
import mvolaLogo from "../../assets/payments/mvola.png";

export default function PaymentSection() {


  const moyensPaiement = [

    {
      nom: "Airtel Money",
      logo: airtelLogo,
      description:
        "Payez rapidement et simplement avec Airtel Money."
    },


    {
      nom: "Orange Money",
      logo: orangeLogo,
      description:
        "Une solution de paiement sécurisée et accessible."
    },


    {
      nom: "MVola",
      logo: mvolaLogo,
      description:
        "Effectuez vos paiements facilement avec MVola."
    }

  ];




  return (

    <section

      className="
      py-20
      bg-white
      "

    >


      <div

        className="
        max-w-7xl
        mx-auto
        px-6
        "

      >


        <div className="text-center mb-12">


          <p

            className="
            text-[#23C483]
            font-semibold
            uppercase
            text-sm
            "

          >

            Paiement sécurisé

          </p>



          <h2

            className="
            text-3xl
            md:text-4xl
            font-bold
            text-[#062A25]
            mt-3
            "

          >

            Plusieurs moyens de paiement disponibles

          </h2>


          <p

            className="
            text-gray-500
            mt-4
            "

          >

            Réglez vos billets facilement avec les solutions
            de paiement disponibles à Madagascar.

          </p>


        </div>






        <div

          className="
          grid
          md:grid-cols-3
          gap-8
          "

        >



          {moyensPaiement.map((paiement)=>(


            <div

              key={paiement.nom}

              className="
              bg-white
              rounded-3xl
              shadow-lg
              border
              border-gray-100
              p-8
              text-center
              hover:-translate-y-2
              transition
              "

            >



              <div

                className="
                h-24
                flex
                justify-center
                items-center
                mb-6
                "

              >


                <img

                  src={paiement.logo}

                  alt={paiement.nom}

                  className="
                  max-h-20
                  w-auto
                  object-contain
                  "

                />


              </div>





              <h3

                className="
                text-xl
                font-bold
                text-[#062A25]
                "

              >

                {paiement.nom}

              </h3>





              <p

                className="
                mt-3
                text-gray-500
                text-sm
                "

              >

                {paiement.description}

              </p>



            </div>


          ))}



        </div>




      </div>


    </section>


  );

}