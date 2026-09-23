import Navbar from "./Navbar";
import SidebarPassager from "./SidebarPassager";

export default function LayoutPassager({ children }) {
  return (
    <div
      className="
        min-h-screen
        bg-[#F7F9F8]
      "
    >
      <Navbar />

      <div
        className="
          flex
          pt-[72px]
        "
      >
        <SidebarPassager />

        <main
          className="
            flex-1
            min-w-0
            p-4
            sm:p-6
            lg:p-8
          "
        >
          {children}
        </main>
      </div>
    </div>
  );
}
