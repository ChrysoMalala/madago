import AdminSidebar from './AdminSidebar'
import AdminHeader from './AdminHeader'

// Layout indépendant : aucune trace de Navbar/Footer public.
// Chaque page admin s'utilise ainsi : <AdminLayout titre="..."> ...contenu... </AdminLayout>
export default function AdminLayout({ titre, children }) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <AdminSidebar />
      <div className="flex-1 ml-60">
        <AdminHeader titre={titre} />
        <main className="p-8">{children}</main>
      </div>
    </div>
  )
}