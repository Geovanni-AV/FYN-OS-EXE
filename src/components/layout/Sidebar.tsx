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
    <aside className="w-[220px] bg-light-card dark:bg-dark-card border-r border-light-border dark:border-dark-border flex flex-col fixed h-full z-30 hidden lg:flex">
      {/* Logo */}
      <div className="p-5 flex items-center gap-3 border-b border-light-border dark:border-dark-border">
        <div className="w-8 h-8 bg-primary rounded-btn flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-white text-lg">account_balance_wallet</span>
        </div>
        <span className="text-sm font-bold text-light-text dark:text-dark-text leading-tight">Fyn Finance OS</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5 no-scrollbar">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <p className="text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider px-2 mb-2">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-btn text-sm transition-colors duration-150 relative ${
                      isActive
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-light-text-2 dark:text-dark-text-2 hover:bg-light-surface dark:hover:bg-dark-surface hover:text-light-text dark:hover:text-dark-text'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r-full shadow-[0_0_8px_rgba(37,99,235,0.4)]" />}
                      <span className="material-symbols-outlined text-xl">{item.icon}</span>
                      <span>{item.label}</span>
                      {item.path === '/alertas' && unread > 0 && (
                        <span className="ml-auto bg-danger text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                          {unread}
                        </span>
                      )}
                    </>
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
