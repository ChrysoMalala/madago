import { useState } from "react";

export default function SearchBox({ onSearch }) {
  const [filtres, setFiltres] = useState({
    depart: "",
    arrivee: "",
    date: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (onSearch) {
      onSearch(filtres);
    }
  };

  return (
    <section
      id="recherche"
      className="
      relative
      max-w-6xl
      mx-auto
      px-6
      pb-8
      z-20
      "
    >
      <form
        onSubmit={handleSubmit}
        className="
        bg-white
        rounded-3xl
        shadow-2xl
        p-6
        grid
        md:grid-cols-4
        gap-4
        border
        border-gray-100
        "
      >
        {/* Départ */}

        <div>
          <label
            className="
            block
            text-sm
            font-semibold
            text-[#062A25]
            mb-2
            "
          >
            Départ
          </label>

          <input
            value={filtres.depart}
            onChange={(e) =>
              setFiltres({
                ...filtres,

                depart: e.target.value,
              })
            }
            placeholder="Ex : Antananarivo"
            className="
            w-full
            px-4
            py-3
            rounded-xl
            border
            border-gray-200
            outline-none
            transition
            focus:ring-2
            focus:ring-[#23C483]
            "
          />
        </div>

        {/* Destination */}

        <div>
          <label
            className="
            block
            text-sm
            font-semibold
            text-[#062A25]
            mb-2
            "
          >
            Destination
          </label>

          <input
            value={filtres.arrivee}
            onChange={(e) =>
              setFiltres({
                ...filtres,

                arrivee: e.target.value,
              })
            }
            placeholder="Ex : Toamasina"
            className="
            w-full
            px-4
            py-3
            rounded-xl
            border
            border-gray-200
            outline-none
            transition
            focus:ring-2
            focus:ring-[#23C483]
            "
          />
        </div>

        {/* Date */}

        <div>
          <label
            className="
            block
            text-sm
            font-semibold
            text-[#062A25]
            mb-2
            "
          >
            Date du voyage
          </label>

          <input
            type="date"
            value={filtres.date}
            onChange={(e) =>
              setFiltres({
                ...filtres,

                date: e.target.value,
              })
            }
            className="
            w-full
            px-4
            py-3
            rounded-xl
            border
            border-gray-200
            outline-none
            transition
            focus:ring-2
            focus:ring-[#23C483]
            "
          />
        </div>

        {/* Bouton recherche */}

        <div
          className="
          flex
          items-end
          "
        >
          <button
            type="submit"
            className="
            w-full
            h-[50px]
            bg-[#23C483]
            hover:bg-[#1cab70]
            active:scale-95
            text-white
            rounded-xl
            font-bold
            transition
            cursor-pointer
            shadow-md
            "
          >
            🔎 Rechercher
          </button>
        </div>
      </form>
    </section>
  );
}
