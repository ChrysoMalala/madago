import Navbar from "./Navbar";
import SidebarConducteur from "./SidebarConducteur";

export default function LayoutConducteur({ children }) {
  return (
    <div
      className="
      min-h-screen
      bg-gray-50
      "
    >
      {/* Navbar globale */}

      <Navbar />

      <div
        className="pt-16
        flex
        "
      >
        {/* Sidebar conducteur */}

        <aside
          className="
          hidden
          md:block
          w-72
          flex-shrink-0
          "
        >
          <SidebarConducteur />
        </aside>

        {/* Contenu principal */}

        <main
          className="
          flex-1
          min-h-screen
          px-4
          sm:px-6
          lg:px-10
          py-8
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
