import Navbar from './Navbar'
import SidebarPassager from './SidebarPassager'

export default function LayoutPassager({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <SidebarPassager />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}