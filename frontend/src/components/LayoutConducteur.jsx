import Navbar from "./Navbar";
import SidebarConducteur from "./SidebarConducteur";

export default function LayoutConducteur({ children }) {
  return (
    <div
      className="
        min-h-screen
        bg-[#F7F9F8]
      "
    >
      {/* ===============================================
          NAVBAR GLOBALE
      =============================================== */}

      <Navbar />

      {/* ===============================================
          LAYOUT
      =============================================== */}

      <div
        className="
          flex
          pt-[72px]
        "
      >
        {/* =============================================
            SIDEBAR CONDUCTEUR
        ============================================= */}

        <div
          className="
            hidden
            lg:block
            w-[270px]
            shrink-0
          "
        >
          <div
            className="
              sticky
              top-[72px]
              h-[calc(100vh-72px)]
              overflow-y-auto
            "
          >
            <SidebarConducteur />
          </div>
        </div>

        {/* =============================================
            CONTENU PRINCIPAL
        ============================================= */}

        <main
          className="
            flex-1
            min-w-0
            p-4
            sm:p-6
            lg:p-8
          "
        >
          <div
            className="
              max-w-7xl
              mx-auto
            "
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
