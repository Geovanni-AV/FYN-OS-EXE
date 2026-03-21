import { useApp } from '../../context/AppContext'
import { useTheme } from '../../context/ThemeContext'

export default function Topbar() {
  const { profile } = useApp()
  const { theme, setTheme } = useTheme()

  return (
    <header className="lg:hidden sticky top-0 z-30 bg-light-card/80 dark:bg-dark-card/80 backdrop-blur-md border-b border-light-border dark:border-dark-border px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-primary rounded-btn flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-white text-lg">account_balance_wallet</span>
        </div>
        <span className="text-sm font-bold text-light-text dark:text-dark-text leading-tight">Fyn Finance</span>
      </div>
      
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-1.5 rounded-full bg-light-surface dark:bg-dark-surface text-light-text-2 dark:text-dark-text-2 hover:text-primary transition-colors focus:ring-2 focus:ring-primary/50"
          title="Cambiar tema"
        >
          <span className="material-symbols-outlined text-xl">
            {theme === 'light' ? 'dark_mode' : 'light_mode'}
          </span>
        </button>
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold border border-primary/30">
          {profile.name.slice(0, 2).toUpperCase()}
        </div>
      </div>
    </header>
  )
}
