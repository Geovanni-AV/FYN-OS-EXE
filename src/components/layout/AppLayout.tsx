import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import Topbar from './Topbar'
import { ToastContainer } from '../ui'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-atelier-bg-light dark:bg-atelier-bg-dark flex flex-col lg:flex-row transition-colors duration-400">
      <Sidebar />
      <main className="flex-1 lg:ml-[260px] pb-20 lg:pb-0 min-w-0 flex flex-col min-h-screen">
        <Topbar />
        <div className="flex-1 w-full max-w-[1400px] mx-auto p-4 lg:p-10">
          <Outlet />
        </div>
      </main>
      <BottomNav />
      <ToastContainer />
    </div>
  )
}
