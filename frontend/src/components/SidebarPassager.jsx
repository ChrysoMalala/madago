import { NavLink } from 'react-router-dom'

export default function SidebarPassager() {
  const lienStyle = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition text-sm font-medium ${
      isActive
        ? 'bg-blue-700 text-white'
        : 'text-gray-600 hover:bg-gray-100'
    }`

  return (
    <aside className="w-64 min-h-screen bg-white shadow-sm border-r border-gray-200 p-4">

      {/* Titre */}
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">
        Espace Passager
      </p>

      {/* Liens */}
      <nav className="flex flex-col gap-1">
        <NavLink to="/passager/profil" className={lienStyle}>
          <span>👤</span> Mon profil
        </NavLink>
        <NavLink to="/passager" end className={lienStyle}>
          <span>🏠</span> Mon espace
        </NavLink>
        <NavLink to="/passager/recherche" className={lienStyle}>
          <span>🔍</span> Rechercher un trajet
        </NavLink>
        <NavLink to="/passager/reservations" className={lienStyle}>
          <span>📋</span> Mes réservations
        </NavLink>
        <div className="border-t border-gray-200 my-2" />
        <NavLink to="/conducteur/inscription" className={lienStyle}>
          <span>🚗</span> Devenir conducteur
        </NavLink>
      </nav>
    </aside>
  )
}