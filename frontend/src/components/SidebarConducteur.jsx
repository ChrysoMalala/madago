import { NavLink, Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function SidebarConducteur() {
  const { utilisateur } = useAuth();

  // =====================================================
  // UTILISATEUR
  // =====================================================

  const nomComplet = utilisateur
    ? `${utilisateur.prenom || ""} ${utilisateur.nom || ""}`.trim()
    : "Conducteur";

  const photo = utilisateur?.photo_profil;

  // =====================================================
  // STYLE DES LIENS
  // =====================================================

  const lienStyle = ({ isActive }) =>
    `
      group
      relative
      flex
      items-center
      gap-3
      w-full
      px-4
      py-3
      rounded-xl
      text-sm
      font-medium
      transition-all
      duration-200

      ${
        isActive
          ? `
            bg-[#23C483]/10
            text-[#062A25]
            font-semibold
          `
          : `
            text-gray-600
            hover:bg-gray-50
            hover:text-[#062A25]
          `
      }
    `;

  // =====================================================
  // INDICATEUR ACTIF
  // =====================================================

  const IndicateurActif = ({ isActive }) =>
    isActive ? (
      <span
        className="
          absolute
          left-0
          top-1/2
          -translate-y-1/2
          w-1
          h-6
          bg-[#23C483]
          rounded-r-full
        "
      />
    ) : null;

  // =====================================================
  // ICÔNE MENU
  // =====================================================

  const IconeMenu = ({ children }) => (
    <span
      className="
        w-9
        h-9
        shrink-0
        rounded-xl
        bg-gray-50
        group-hover:bg-[#23C483]/10
        flex
        items-center
        justify-center
        text-base
        transition
      "
    >
      {children}
    </span>
  );

  return (
    <aside
      className="
        flex
        flex-col
        w-[270px]
        min-h-[calc(100vh-72px)]
        bg-white
        border-r
        border-gray-100
      "
    >
      {/* ===============================================
          PROFIL CONDUCTEUR
      =============================================== */}

      <div
        className="
          px-5
          pt-6
          pb-5
        "
      >
        <Link
          to="/conducteur/profil"
          className="
            group
            flex
            items-center
            gap-3
            p-3
            rounded-2xl
            hover:bg-[#23C483]/5
            transition
          "
        >
          {/* PDP */}

          <div
            className="
              relative
              shrink-0
            "
          >
            <div
              className="
                w-12
                h-12
                rounded-full
                overflow-hidden
                bg-[#EAF8F3]
                border-2
                border-[#23C483]/20
                flex
                items-center
                justify-center
              "
            >
              {photo ? (
                <img
                  src={photo}
                  alt="Photo de profil"
                  className="
                    w-full
                    h-full
                    object-cover
                  "
                />
              ) : (
                <span className="text-xl">👤</span>
              )}
            </div>

            {/* Petit indicateur conducteur */}

            <span
              className="
                absolute
                -right-1
                -bottom-1
                w-5
                h-5
                rounded-full
                bg-[#23C483]
                border-2
                border-white
                flex
                items-center
                justify-center
                text-[9px]
              "
            >
              🚗
            </span>
          </div>

          {/* IDENTITÉ */}

          <div
            className="
              min-w-0
              flex-1
            "
          >
            <p
              className="
                text-sm
                font-bold
                text-[#062A25]
                truncate
              "
            >
              {nomComplet}
            </p>

            <div
              className="
                flex
                items-center
                gap-1
                mt-1
              "
            >
              <span
                className="
                  text-[11px]
                  font-semibold
                  text-[#008F65]
                  bg-[#23C483]/10
                  px-2
                  py-0.5
                  rounded-full
                "
              >
                🚗 Conducteur
              </span>
            </div>
          </div>

          <span
            className="
              text-gray-300
              group-hover:text-[#23C483]
              transition
            "
          >
            ›
          </span>
        </Link>
      </div>

      {/* ===============================================
          SÉPARATEUR
      =============================================== */}

      <div
        className="
          mx-6
          border-t
          border-gray-100
        "
      />

      {/* ===============================================
          NAVIGATION
      =============================================== */}

      <div
        className="
          flex-1
          px-4
          py-5
        "
      >
        <p
          className="
            px-4
            mb-3
            text-[11px]
            font-bold
            text-gray-400
            uppercase
            tracking-[0.15em]
          "
        >
          Navigation
        </p>

        <nav
          className="
            flex
            flex-col
            gap-1.5
          "
        >
          {/* TABLEAU DE BORD */}

          <NavLink to="/conducteur" end className={lienStyle}>
            {({ isActive }) => (
              <>
                <IndicateurActif isActive={isActive} />

                <IconeMenu>🏠</IconeMenu>

                <span>Tableau de bord</span>
              </>
            )}
          </NavLink>

          {/* TRAJETS */}

          <NavLink to="/conducteur/trajets" className={lienStyle}>
            {({ isActive }) => (
              <>
                <IndicateurActif isActive={isActive} />

                <IconeMenu>🗺️</IconeMenu>

                <span>Mes trajets</span>
              </>
            )}
          </NavLink>

          {/* VÉHICULES */}

          <NavLink to="/conducteur/vehicules" className={lienStyle}>
            {({ isActive }) => (
              <>
                <IndicateurActif isActive={isActive} />

                <IconeMenu>🚗</IconeMenu>

                <span>Mes véhicules</span>
              </>
            )}
          </NavLink>

          {/* REVENUS */}

          <NavLink to="/conducteur/revenus" className={lienStyle}>
            {({ isActive }) => (
              <>
                <IndicateurActif isActive={isActive} />

                <IconeMenu>💰</IconeMenu>

                <span>Mes revenus</span>
              </>
            )}
          </NavLink>

          {/* AVIS */}

          <NavLink to="/conducteur/avis" className={lienStyle}>
            {({ isActive }) => (
              <>
                <IndicateurActif isActive={isActive} />

                <IconeMenu>⭐</IconeMenu>

                <span>Mes avis</span>
              </>
            )}
          </NavLink>

          {/* PROFIL */}

          <NavLink to="/conducteur/profil" className={lienStyle}>
            {({ isActive }) => (
              <>
                <IndicateurActif isActive={isActive} />

                <IconeMenu>👤</IconeMenu>

                <span>Mon profil</span>
              </>
            )}
          </NavLink>
        </nav>

        {/* =============================================
            ESPACE PASSAGER
        ============================================= */}

        <div
          className="
            mt-6
            pt-5
            border-t
            border-gray-100
          "
        >
          <p
            className="
              px-4
              mb-3
              text-[11px]
              font-bold
              text-gray-400
              uppercase
              tracking-[0.15em]
            "
          >
            Passager
          </p>

          <Link
            to="/passager"
            className="
              group
              flex
              items-center
              gap-3
              px-4
              py-3
              rounded-xl
              bg-[#062A25]
              text-white
              hover:bg-[#0A3D35]
              transition
            "
          >
            <span
              className="
                w-9
                h-9
                shrink-0
                rounded-xl
                bg-white/10
                flex
                items-center
                justify-center
              "
            >
              🧳
            </span>

            <div
              className="
                flex-1
                min-w-0
              "
            >
              <p
                className="
                  text-sm
                  font-semibold
                "
              >
                Espace passager
              </p>

              <p
                className="
                  text-[10px]
                  text-white/60
                  mt-0.5
                "
              >
                Basculer vers passager
              </p>
            </div>

            <span
              className="
                text-white/50
                group-hover:translate-x-1
                transition
              "
            >
              →
            </span>
          </Link>
        </div>
      </div>

      {/* ===============================================
          BAS DE SIDEBAR
      =============================================== */}

      <div
        className="
          px-5
          py-5
          border-t
          border-gray-100
        "
      >
        <div
          className="
            flex
            items-start
            gap-3
            p-3
            rounded-2xl
            bg-[#F7F9F8]
          "
        >
          <div
            className="
              w-8
              h-8
              shrink-0
              rounded-lg
              bg-[#23C483]/10
              flex
              items-center
              justify-center
            "
          >
            🛡️
          </div>

          <div>
            <p
              className="
                text-xs
                font-semibold
                text-[#062A25]
              "
            >
              MadaGo sécurisé
            </p>

            <p
              className="
                text-[10px]
                leading-relaxed
                text-gray-400
                mt-1
              "
            >
              Votre espace conducteur et vos trajets sont protégés.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
