import { useAdminAuth } from '../../context/AdminAuthContext'

export default function AdminHeader({ titre }) {
  const { admin } = useAdminAuth()

  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center">
      <h1 className="text-xl font-bold text-slate-800">{titre}</h1>
      <div className="text-right">
        <p className="text-sm font-semibold text-slate-700">
          {admin?.prenom} {admin?.nom}
        </p>
        <p className="text-xs text-slate-400">Administrateur</p>
      </div>
    </header>
  )
}