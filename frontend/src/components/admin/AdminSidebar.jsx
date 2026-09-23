import { NavLink } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'

const LIENS = [
  { to: '/admin/dashboard', icone: '📊', label: 'Tableau de bord' },
  { to: '/admin/conducteurs', icone: '👤', label: 'Conducteurs' },
  { to: '/admin/vehicules', icone: '🚗', label: 'Véhicules' },
]

export default function AdminSidebar() {
  const { adminDeconnexion } = useAdminAuth()

  return (
    <aside className="w-60 bg-slate-900 text-slate-300 min-h-screen flex flex-col fixed left-0 top-0">
      <div className="px-6 py-6 border-b border-slate-700">
        <p className="text-white font-bold text-lg">🛠️ MadaGo</p>
        <p className="text-xs text-slate-500 uppercase tracking-wide">Administration</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {LIENS.map((lien) => (
          <NavLink
            key={lien.to}
            to={lien.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'hover:bg-slate-800 text-slate-300'
              }`
            }
          >
            <span>{lien.icone}</span>
            {lien.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-slate-700">
        <button
          onClick={adminDeconnexion}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-slate-800 transition"
        >
          🚪 Déconnexion
        </button>
      </div>
    </aside>
  )
}