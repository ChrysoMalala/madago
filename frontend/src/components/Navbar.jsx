import { useState, useEffect, useRef } from "react";

import { Link, useNavigate, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import PreferenceSwitcher from "./PreferenceSwitcher";

import logoMadaGo from "../assets/images/logo-madago.png";

import api from "../api/axios";

export default function Navbar() {
  const { utilisateur, profilConducteur, deconnexion } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  // =====================================================
  // PAGE ACCUEIL
  // =====================================================

  const estAccueil = location.pathname === "/";

  const [menuOuvert, setMenuOuvert] = useState(false);

  const [clocheOuverte, setClocheOuverte] = useState(false);

  const [notifications, setNotifications] = useState([]);

  const [nonLues, setNonLues] = useState(0);

  const [scrolled, setScrolled] = useState(false);

  const clocheRef = useRef(null);

  // =====================================================
  // SCROLL NAVBAR
  // =====================================================

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // =====================================================
  // STATUT CONDUCTEUR
  // =====================================================

  const estConducteurValide = profilConducteur?.statut_validation === "valide";

  const aDemandeEnAttente =
    profilConducteur && profilConducteur.statut_validation !== "valide";

  // =====================================================
  // NOTIFICATIONS
  // =====================================================

  const chargerNotifications = async () => {
    if (!utilisateur) return;

    try {
      const reponse = await api.get("/notifications/");

      setNotifications(reponse.data.slice(0, 5));

      setNonLues(reponse.data.filter((n) => !n.lu).length);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    chargerNotifications();

    const interval = setInterval(chargerNotifications, 60000);

    return () => clearInterval(interval);
  }, [utilisateur]);

  // =====================================================
  // FERMER NOTIFICATIONS AU CLIC EXTÉRIEUR
  // =====================================================

  useEffect(() => {
    const fermer = (event) => {
      if (clocheRef.current && !clocheRef.current.contains(event.target)) {
        setClocheOuverte(false);
      }
    };

    document.addEventListener("mousedown", fermer);

    return () => {
      document.removeEventListener("mousedown", fermer);
    };
  }, []);

  // =====================================================
  // DÉCONNEXION
  // =====================================================

  const handleDeconnexion = () => {
    deconnexion();

    navigate("/");

    setMenuOuvert(false);
  };

  // =====================================================
  // APPARENCE NAVBAR
  // =====================================================

  const navbarClaire = !estAccueil || scrolled;

  return (
    <nav
      className={`
        fixed
        top-0
        left-0
        w-full
        z-50
        transition-all
        duration-300

        ${
          navbarClaire
            ? `
              bg-white/95
              backdrop-blur-md
              shadow-lg
              text-[#062A25]
            `
            : `
              bg-transparent
              text-white
            `
        }
      `}
    >
      <div
        className="
          max-w-7xl
          mx-auto
          px-6
          py-2
          flex
          justify-between
          items-center
        "
      >
        {/* =================================================
            LOGO
        ================================================= */}

        <Link
          to="/"
          className="
            flex
            items-center
            gap-4
            min-w-[220px]
            h-14
          "
        >
          <img
            src={logoMadaGo}
            alt="MadaGo"
            className="
              h-16
              w-auto
              object-contain
            "
          />
        </Link>

        {/* =================================================
            NAVIGATION PRINCIPALE
        ================================================= */}

        <div
          className="
            hidden
            lg:flex
            items-center
            gap-8
            text-sm
            font-medium
          "
        >
          <Link
            to="/"
            className="
              hover:text-[#23C483]
              transition
            "
          >
            Accueil
          </Link>

          <Link
            to="/passager/recherche"
            className="
              hover:text-[#23C483]
              transition
            "
          >
            Trajets
          </Link>

          <a
            href="#pourquoi"
            className="
              hover:text-[#23C483]
              transition
            "
          >
            Pourquoi MadaGo ?
          </a>

          <a
            href="#securite"
            className="
              hover:text-[#23C483]
              transition
            "
          >
            Sécurité
          </a>

          <a
            href="#contact"
            className="
              hover:text-[#23C483]
              transition
            "
          >
            Contact
          </a>
        </div>

        {/* =================================================
            ZONE DROITE
        ================================================= */}

        <div
          className="
            hidden
            lg:flex
            items-center
            gap-3
          "
        >
          <PreferenceSwitcher />

          {/* ===============================================
              NOTIFICATIONS
          =============================================== */}

          {utilisateur && (
            <div className="relative" ref={clocheRef}>
              <button
                type="button"
                onClick={() => {
                  setClocheOuverte(!clocheOuverte);

                  setMenuOuvert(false);
                }}
                className={`
                  relative
                  w-10
                  h-10
                  rounded-xl
                  backdrop-blur
                  border
                  transition

                  ${
                    navbarClaire
                      ? `
                        bg-gray-50
                        border-gray-200
                        hover:bg-[#23C483]/10
                      `
                      : `
                        bg-white/10
                        border-white/20
                        hover:bg-[#23C483]/20
                      `
                  }
                `}
              >
                🔔
                {nonLues > 0 && (
                  <span
                    className="
                      absolute
                      -top-1
                      -right-1
                      bg-red-500
                      text-white
                      text-xs
                      font-bold
                      w-5
                      h-5
                      rounded-full
                      flex
                      items-center
                      justify-center
                    "
                  >
                    {nonLues > 9 ? "9+" : nonLues}
                  </span>
                )}
              </button>

              {clocheOuverte && (
                <div
                  className="
                    absolute
                    right-0
                    mt-3
                    w-80
                    bg-white
                    text-gray-800
                    rounded-2xl
                    shadow-xl
                    overflow-hidden
                  "
                >
                  <div
                    className="
                      px-5
                      py-4
                      border-b
                      font-bold
                    "
                  >
                    🔔 Notifications
                  </div>

                  {notifications.length === 0 ? (
                    <div
                      className="
                        p-6
                        text-center
                        text-gray-400
                      "
                    >
                      Aucune notification
                    </div>
                  ) : (
                    <div
                      className="
                        max-h-80
                        overflow-y-auto
                      "
                    >
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className="
                              px-5
                              py-4
                              border-b
                              hover:bg-gray-50
                              cursor-pointer
                            "
                        >
                          <p
                            className="
                                text-sm
                                font-semibold
                              "
                          >
                            {n.titre}
                          </p>

                          <p
                            className="
                                text-xs
                                text-gray-500
                                mt-1
                              "
                          >
                            {n.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ===============================================
              UTILISATEUR
          =============================================== */}

          {utilisateur ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setMenuOuvert(!menuOuvert);

                  setClocheOuverte(false);
                }}
                className={`
                  flex
                  items-center
                  gap-2
                  px-3
                  py-2
                  rounded-xl
                  backdrop-blur
                  border
                  transition

                  ${
                    navbarClaire
                      ? `
                        bg-gray-50
                        border-gray-200
                        hover:bg-[#23C483]/10
                      `
                      : `
                        bg-white/10
                        border-white/20
                        hover:bg-[#23C483]/20
                      `
                  }
                `}
              >
                {/* =========================================
                    PHOTO DE PROFIL
                ========================================= */}

                <div
                  className="
                    w-8
                    h-8
                    rounded-full
                    overflow-hidden
                    shrink-0
                    flex
                    items-center
                    justify-center
                    bg-[#23C483]/15
                  "
                >
                  {utilisateur.photo_profil ? (
                    <img
                      src={utilisateur.photo_profil}
                      alt="Photo de profil"
                      className="
                        w-full
                        h-full
                        object-cover
                      "
                    />
                  ) : (
                    <span
                      className="
                        text-base
                      "
                    >
                      👤
                    </span>
                  )}
                </div>

                <span
                  className="
                    text-sm
                    font-medium
                  "
                >
                  {utilisateur.prenom}
                </span>

                <span>{menuOuvert ? "▲" : "▼"}</span>
              </button>

              {/* =========================================
                  MENU UTILISATEUR
              ========================================= */}

              {menuOuvert && (
                <div
                  className="
                    absolute
                    right-0
                    mt-3
                    w-64
                    bg-white
                    text-[#062A25]
                    rounded-2xl
                    shadow-xl
                    overflow-hidden
                  "
                >
                  {/* Petit en-tête profil */}

                  <div
                    className="
                      px-5
                      py-4
                      border-b
                      flex
                      items-center
                      gap-3
                    "
                  >
                    <div
                      className="
                        w-10
                        h-10
                        rounded-full
                        overflow-hidden
                        shrink-0
                        bg-[#23C483]/15
                        flex
                        items-center
                        justify-center
                      "
                    >
                      {utilisateur.photo_profil ? (
                        <img
                          src={utilisateur.photo_profil}
                          alt="Photo de profil"
                          className="
                            w-full
                            h-full
                            object-cover
                          "
                        />
                      ) : (
                        <span>👤</span>
                      )}
                    </div>

                    <div
                      className="
                        min-w-0
                      "
                    >
                      <p
                        className="
                          font-semibold
                          truncate
                        "
                      >
                        {utilisateur.prenom} {utilisateur.nom}
                      </p>

                      <p
                        className="
                          text-xs
                          text-gray-500
                          truncate
                        "
                      >
                        {utilisateur.email}
                      </p>
                    </div>
                  </div>

                  <Link
                    to="/passager"
                    className="
                      block
                      px-5
                      py-3
                      hover:bg-gray-50
                    "
                  >
                    🧳 Espace passager
                  </Link>

                  {estConducteurValide && (
                    <Link
                      to="/conducteur"
                      className="
                        block
                        px-5
                        py-3
                        hover:bg-gray-50
                      "
                    >
                      🚗 Espace conducteur
                    </Link>
                  )}

                  {!profilConducteur && (
                    <Link
                      to="/conducteur/inscription"
                      className="
                        block
                        px-5
                        py-3
                        text-[#008F65]
                        hover:bg-green-50
                      "
                    >
                      🚗 Devenir conducteur
                    </Link>
                  )}

                  {aDemandeEnAttente && (
                    <div
                      className="
                        px-5
                        py-3
                        bg-yellow-50
                        text-yellow-700
                        text-sm
                      "
                    >
                      ⏳ Demande en attente
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleDeconnexion}
                    className="
                      w-full
                      text-left
                      px-5
                      py-3
                      text-red-600
                      hover:bg-red-50
                    "
                  >
                    🚪 Déconnexion
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <Link
                to="/connexion"
                className="
                  text-sm
                  hover:text-[#23C483]
                  transition
                "
              >
                Connexion
              </Link>

              <Link
                to="/inscription"
                className="
                  bg-[#23C483]
                  text-white
                  px-5
                  py-2
                  rounded-xl
                  font-semibold
                  hover:bg-[#1cab70]
                  transition
                "
              >
                Inscription
              </Link>
            </div>
          )}
        </div>

        {/* =================================================
            BOUTON MOBILE
        ================================================= */}

        <button
          type="button"
          className="
            lg:hidden
            text-2xl
          "
          onClick={() => setMenuOuvert(!menuOuvert)}
        >
          ☰
        </button>
      </div>

      {/* ===================================================
          MENU MOBILE
      =================================================== */}

      {menuOuvert && (
        <div
          className="
            lg:hidden
            bg-[#062A25]
            text-white
            px-6
            py-6
            space-y-4
          "
        >
          <Link to="/" className="block" onClick={() => setMenuOuvert(false)}>
            Accueil
          </Link>

          <Link
            to="/passager/recherche"
            className="block"
            onClick={() => setMenuOuvert(false)}
          >
            Trajets
          </Link>

          <a
            href="#pourquoi"
            className="block"
            onClick={() => setMenuOuvert(false)}
          >
            Pourquoi MadaGo ?
          </a>

          <a
            href="#securite"
            className="block"
            onClick={() => setMenuOuvert(false)}
          >
            Sécurité
          </a>

          <a
            href="#contact"
            className="block"
            onClick={() => setMenuOuvert(false)}
          >
            Contact
          </a>

          {utilisateur ? (
            <div
              className="
                pt-4
                mt-4
                border-t
                border-white/20
                space-y-4
              "
            >
              {/* Photo utilisateur mobile */}

              <div
                className="
                  flex
                  items-center
                  gap-3
                  pb-2
                "
              >
                <div
                  className="
                    w-10
                    h-10
                    rounded-full
                    overflow-hidden
                    bg-white/10
                    flex
                    items-center
                    justify-center
                  "
                >
                  {utilisateur.photo_profil ? (
                    <img
                      src={utilisateur.photo_profil}
                      alt="Photo de profil"
                      className="
                        w-full
                        h-full
                        object-cover
                      "
                    />
                  ) : (
                    <span>👤</span>
                  )}
                </div>

                <div>
                  <p className="font-semibold">
                    {utilisateur.prenom} {utilisateur.nom}
                  </p>

                  <p
                    className="
                      text-xs
                      text-white/60
                    "
                  >
                    {utilisateur.email}
                  </p>
                </div>
              </div>

              <Link
                to="/passager"
                className="block"
                onClick={() => setMenuOuvert(false)}
              >
                🧳 Espace passager
              </Link>

              {estConducteurValide && (
                <Link
                  to="/conducteur"
                  className="block"
                  onClick={() => setMenuOuvert(false)}
                >
                  🚗 Espace conducteur
                </Link>
              )}

              {!profilConducteur && (
                <Link
                  to="/conducteur/inscription"
                  className="
                    block
                    text-[#23C483]
                  "
                  onClick={() => setMenuOuvert(false)}
                >
                  🚗 Devenir conducteur
                </Link>
              )}

              {aDemandeEnAttente && (
                <div
                  className="
                    text-yellow-300
                    text-sm
                  "
                >
                  ⏳ Demande conducteur en attente
                </div>
              )}

              <button
                type="button"
                onClick={handleDeconnexion}
                className="
                  block
                  text-red-300
                "
              >
                🚪 Déconnexion
              </button>
            </div>
          ) : (
            <div
              className="
                pt-4
                mt-4
                border-t
                border-white/20
                space-y-4
              "
            >
              <Link
                to="/connexion"
                className="block"
                onClick={() => setMenuOuvert(false)}
              >
                Connexion
              </Link>

              <Link
                to="/inscription"
                className="
                  block
                  text-[#23C483]
                  font-semibold
                "
                onClick={() => setMenuOuvert(false)}
              >
                Inscription
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
