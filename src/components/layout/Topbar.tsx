import { useApp } from '../../context/AppContext'
import { useTheme } from '../../context/ThemeContext'

export default function Topbar() {
  const { profile } = useApp()
  const { theme, setTheme } = useTheme()

  return (
    <header className="lg:hidden sticky top-0 z-30 glass px-6 py-4 flex items-center justify-between mx-4 mt-4 rounded-full shadow-luster transition-all duration-500">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="material-symbols-outlined text-white text-xl font-light">account_balance_wallet</span>
        </div>
        <span className="text-base font-black text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tight">FYN</span>
      </div>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-9 h-9 flex items-center justify-center rounded-full depth-1 text-atelier-text-muted-light dark:text-atelier-text-muted-dark hover:text-primary transition-all active:scale-90"
          title="Cambiar tema"
        >
          <span className="material-symbols-outlined text-2xl font-light">
            {theme === 'light' ? 'dark_mode' : 'light_mode'}
          </span>
        </button>
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold ring-2 ring-primary/20">
          {profile.name.slice(0, 2).toUpperCase()}
        </div>
      </div>
    </header>
  )
}
