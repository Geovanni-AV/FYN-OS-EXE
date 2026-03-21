import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: 'dashboard' },
  { path: '/analisis', label: 'Análisis', icon: 'analytics' },
  { path: '/registro', label: 'Registro', icon: 'add_circle' },
  { path: '/cuentas', label: 'Cuentas', icon: 'account_balance' },
  { path: '/presupuestos', label: 'Presupuestos', icon: 'payments' },
  { path: '/calendario', label: 'Calendario', icon: 'calendar_month' },
  { path: '/deudas', label: 'Deudas', icon: 'credit_card' },
  { path: '/alertas', label: 'Alertas', icon: 'notifications' },
]

export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card flex flex-col h-screen fixed left-0 top-16 z-30 transition-all duration-300">
      <div className="flex-1 overflow-y-auto py-6 no-scrollbar">
        <nav className="px-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                relative group flex items-center gap-3 px-4 py-3 rounded-btn text-sm font-medium transition-all
                ${isActive 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-light-text-2 dark:text-dark-text-2 hover:bg-light-surface dark:hover:bg-dark-surface hover:text-light-text dark:hover:text-dark-text'}
              `}
            >
              {({ isActive }) => (
                <>
                  {/* Indicador vertical para estado activo */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary rounded-r-full shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
                  )}
                  
                  <span className={`material-symbols-outlined text-xl transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-primary' : 'text-light-muted dark:text-dark-muted'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  
                  {!isActive && (
                    <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-xs">chevron_right</span>
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
      
      <div className="p-4 border-t border-light-border dark:border-dark-border">
        <div className="glass-card p-3 rounded-card text-xs">
          <div className="flex items-center gap-2 mb-2 font-bold text-primary uppercase tracking-tighter">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            FYN PRO
          </div>
          <p className="text-light-muted dark:text-dark-muted mb-3 leading-relaxed">Analítica avanzada desbloqueada.</p>
          <div className="w-full h-1 bg-light-border dark:bg-dark-border rounded-full overflow-hidden">
            <div className="h-full bg-primary w-full shadow-[0_0_8px_rgba(37,99,235,0.4)]" />
          </div>
        </div>
      </div>
    </aside>
  )
}
