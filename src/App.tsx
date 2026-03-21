import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { ToastProvider } from './context/ToastContext'
import { ThemeProvider } from './context/ThemeContext'
import AppLayout from './components/layout/AppLayout'

// Screens
import Onboarding from './screens/Onboarding'
import Dashboard from './screens/Dashboard'
import Registro from './screens/Registro'
import Cuentas from './screens/Cuentas'
import Alertas from './screens/Alertas'
import Presupuestos from './screens/Presupuestos'
import Deudas from './screens/Deudas'
import Calendario from './screens/Calendario'
import Analisis from './screens/Analisis'
import Metas from './screens/Metas'
import Simulador from './screens/Simulador'
import NetWorth from './screens/NetWorth'
import Perfil from './screens/Perfil'

// Fallback visual para rutas no implementadas aún
function InConstruction({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh]">
      <span className="material-symbols-outlined text-6xl text-primary/40 mb-4 animate-pulse">construction</span>
      <h2 className="text-xl font-bold text-light-text dark:text-dark-text mb-2">{name}</h2>
      <p className="text-light-text-2 dark:text-dark-text-2">Módulo en construcción o pendiente de integrar.</p>
    </div>
  )
}

function RequireOnboarding({ children }: { children: JSX.Element }) {
  const isDone = localStorage.getItem('fyn-onboarding-done')
  if (!isDone) return <Navigate to="/onboarding" replace />
  return children
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ToastProvider>
          <AppProvider>
            <Routes>
              <Route path="/onboarding" element={<Onboarding />} />
              
              <Route path="/" element={<RequireOnboarding><AppLayout /></RequireOnboarding>}>
                <Route index element={<Dashboard />} />
                <Route path="registro" element={<Registro />} />
                <Route path="cuentas" element={<Cuentas />} />
                <Route path="alertas" element={<Alertas />} />
                <Route path="presupuestos" element={<Presupuestos />} />
                
                {/* Rutas en construcción */}
                <Route path="analisis" element={<Analisis />} />
                <Route path="perfil" element={<Perfil />} />
                <Route path="deudas" element={<Deudas />} />
                <Route path="metas" element={<Metas />} />
                <Route path="calendario" element={<Calendario />} />
                <Route path="simulador" element={<Simulador />} />
                <Route path="net-worth" element={<NetWorth />} />
              </Route>
            </Routes>
          </AppProvider>
        </ToastProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
