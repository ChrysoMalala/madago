import { NavLink } from "react-router-dom";

export default function SidebarConducteur() {
  const lienStyle = ({ isActive }) =>
    `

    flex
    items-center
    gap-3
    px-4
    py-3
    rounded-xl
    transition
    text-sm
    font-semibold

    ${
      isActive
        ? "bg-[#062A25] text-white shadow-md"
        : "text-gray-600 hover:bg-green-50 hover:text-[#062A25]"
    }

    `;

  return (
    <aside
      className="
      w-72
      min-h-screen
      bg-white
      border-r
      border-gray-200
      shadow-sm
      p-5
      flex
      flex-col
      "
    >
      {/* LOGO / TITRE */}

      <div
        className="
        mb-8
        "
      >
        <div
          className="
          flex
          items-center
          gap-3
          "
        >
          <div
            className="
            text-3xl
            "
          >
            🚗
          </div>

          <div>
            <h1
              className="
              text-xl
              font-bold
              text-[#062A25]
              "
            >
              MadaGo
            </h1>

            <p
              className="
              text-xs
              text-gray-400
              uppercase
              tracking-widest
              "
            >
              Conducteur
            </p>
          </div>
        </div>
      </div>

      {/* TITRE MENU */}

      <p
        className="
        text-xs
        font-bold
        text-gray-400
        uppercase
        tracking-widest
        mb-4
        px-2
        "
      >
        Espace conducteur
      </p>

      {/* MENU */}

      <nav
        className="
        flex
        flex-col
        gap-2
        "
      >
        <NavLink to="/conducteur" end className={lienStyle}>
          <span className="text-xl">🏠</span>
          Tableau de bord
        </NavLink>

        <NavLink to="/conducteur/profil" className={lienStyle}>
          <span className="text-xl">👤</span>
          Mon profil
        </NavLink>

        <NavLink to="/conducteur/vehicules" className={lienStyle}>
          <span className="text-xl">🚗</span>
          Mes véhicules
        </NavLink>

        <NavLink to="/conducteur/trajets" className={lienStyle}>
          <span className="text-xl">🗺️</span>
          Mes trajets
        </NavLink>

        <NavLink to="/conducteur/revenus" className={lienStyle}>
          <span className="text-xl">💰</span>
          Mes revenus
        </NavLink>

        <NavLink to="/conducteur/avis" className={lienStyle}>
          <span className="text-xl">⭐</span>
          Mes avis
        </NavLink>
      </nav>

      {/* ESPACE BAS */}

      <div
        className="
        mt-auto
        pt-8
        "
      >
        <div
          className="
          bg-green-50
          border
          border-green-200
          rounded-2xl
          p-4
          "
        >
          <p
            className="
            text-sm
            font-semibold
            text-[#062A25]
            "
          >
            🔐 MadaGo sécurisé
          </p>

          <p
            className="
            text-xs
            text-gray-500
            mt-2
            "
          >
            Votre espace conducteur est protégé.
          </p>
        </div>
      </div>
    </aside>
  );
}
