import { useState, useEffect, useRef } from "react";

import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import PreferenceSwitcher from "./PreferenceSwitcher";
import logoMadaGo from "../assets/images/logo-madago.png";

import api from "../api/axios";

export default function Navbar() {
  const { utilisateur, profilConducteur, deconnexion, t } = useAuth();

  const navigate = useNavigate();

  const [menuOuvert, setMenuOuvert] = useState(false);

  const [clocheOuverte, setClocheOuverte] = useState(false);

  const [notifications, setNotifications] = useState([]);

  const [nonLues, setNonLues] = useState(0);

  const [scrolled, setScrolled] = useState(false);

  const clocheRef = useRef(null);

  /*
  =====================================
  Gestion apparition navbar au scroll
  =====================================
  */

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  /*
  =====================================
  Statut conducteur
  =====================================
  */

  const estConducteurValide = profilConducteur?.statut_validation === "valide";

  const aDemandeEnAttente =
    profilConducteur && profilConducteur.statut_validation !== "valide";

  /*
  =====================================
  Notifications
  =====================================
  */

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

  /*
  =====================================
  Fermer cloche extérieur
  =====================================
  */

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

  /*
  =====================================
  Déconnexion
  =====================================
  */

  const handleDeconnexion = () => {
    deconnexion();

    navigate("/");

    setMenuOuvert(false);
  };

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
        scrolled
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
        {/* LOGO */}

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

          {/* <span
            className="
    text-2xl
    font-bold
    "
          >
            MadaGo
          </span> */}
        </Link>

        {/* MENU PRINCIPAL */}

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
        {/* ZONE DROITE */}

        <div
          className="
          hidden
          lg:flex
          items-center
          gap-3
          "
        >
          {/* Langue / thème */}

          <PreferenceSwitcher />

          {/* Notifications */}

          {utilisateur && (
            <div
              className="
              relative
              "
              ref={clocheRef}
            >
              <button
                onClick={() => {
                  setClocheOuverte(!clocheOuverte);

                  setMenuOuvert(false);
                }}
                className="
                relative
                w-10
                h-10
                rounded-xl
                bg-white/10
                backdrop-blur
                border
                border-white/20
                hover:bg-[#23C483]/20
                transition
                "
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

              {/* Liste notifications */}

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

          {/* Utilisateur */}

          {utilisateur ? (
            <div
              className="
              relative
              "
            >
              <button
                onClick={() => {
                  setMenuOuvert(!menuOuvert);

                  setClocheOuverte(false);
                }}
                className="
                flex
                items-center
                gap-2
                px-4
                py-2
                rounded-xl
                bg-white/10
                backdrop-blur
                border
                border-white/20
                hover:bg-[#23C483]/20
                transition
                "
              >
                👤
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

        {/* MOBILE */}

        <button
          className="
          lg:hidden
          text-2xl
          "
          onClick={() => setMenuOuvert(!menuOuvert)}
        >
          ☰
        </button>
      </div>

      {/* MENU MOBILE */}

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
          <Link to="/">Accueil</Link>

          <Link to="/passager/recherche">Trajets</Link>

          <a href="#pourquoi">Pourquoi MadaGo ?</a>

          <a href="#securite">Sécurité</a>

          <a href="#contact">Contact</a>
        </div>
      )}
    </nav>
  );
}
