import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { Card, Button, Badge, CalendarGrid, type CalendarEvent } from '../../components/ui'
import { formatMXN, CATEGORY_ICONS, CATEGORY_COLORS, CATEGORY_LABELS } from '../../types'

export default function Calendario() {
  const { transactions, debts, goals } = useApp()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate())

  const curMonth = currentDate.getMonth()
  const curYear = currentDate.getFullYear()

  const handlePrevMonth = () => setCurrentDate(new Date(curYear, curMonth - 1, 1))
  const handleNextMonth = () => setCurrentDate(new Date(curYear, curMonth + 1, 1))
  const handleToday = () => {
    const now = new Date()
    setCurrentDate(now)
    setSelectedDay(now.getDate())
  }

  // Calculate events for the current month
  const events: CalendarEvent[] = useMemo(() => {
    const evs: CalendarEvent[] = []

    // 1. Transactions (filtering for current month/year)
    transactions.forEach(t => {
      const d = new Date(t.date)
      if (d.getMonth() === curMonth && d.getFullYear() === curYear) {
        evs.push({
          id: `tx-${t.id}`,
          day: d.getDate(),
          title: t.description,
          type: t.type === 'ingreso' ? 'success' : 'info',
          color: CATEGORY_COLORS[t.category],
          amount: t.amount,
          icon: CATEGORY_ICONS[t.category]
        })
      }
    })

    // 2. Debts (assuming they occur every month on dueDay)
    debts.forEach(debt => {
      evs.push({
        id: `debt-${debt.id}`,
        day: debt.dueDay,
        title: `Pago: ${debt.name}`,
        type: 'danger',
        color: '#EF4444',
        amount: debt.minimumPayment,
        icon: 'payments'
      })
    })

    // 3. Goals (if targetDate is in this month)
    goals.forEach(goal => {
      const d = new Date(goal.targetDate)
      if (d.getMonth() === curMonth && d.getFullYear() === curYear) {
        evs.push({
          id: `goal-${goal.id}`,
          day: d.getDate(),
          title: `Meta: ${goal.name}`,
          type: 'success',
          color: goal.color,
          amount: goal.targetAmount,
          icon: goal.icon
        })
      }
    })

    return evs
  }, [transactions, debts, goals, curMonth, curYear])

  const selectedDayEvents = events.filter(e => e.day === selectedDay)

  return (
    <div className="space-y-12 animate-fade-in pb-12">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-xs font-bold text-primary uppercase tracking-[0.3em] mb-4 opacity-80">Agenda Financiera</p>
          <h1 className="display-lg text-atelier-text-main-light dark:text-atelier-text-main-dark leading-[0.9]">
            El Diario <br />
            <span className="text-primary/40 text-[0.8em]">del Atelier.</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-30 mt-6 italic">
            <span className="capitalize">{currentDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 depth-1 p-2 rounded-full border border-primary/5">
          <Button variant="ghost" size="sm" iconOnly onClick={handlePrevMonth} className="!rounded-full hover:bg-primary/5">
             <span className="material-symbols-outlined font-light">chevron_left</span>
          </Button>
          <Button variant="ghost" size="sm" className="px-6 !rounded-full !text-[9px] font-black uppercase tracking-widest text-primary" onClick={handleToday}>
            Presente
          </Button>
          <Button variant="ghost" size="sm" iconOnly onClick={handleNextMonth} className="!rounded-full hover:bg-primary/5">
             <span className="material-symbols-outlined font-light">chevron_right</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Calendar Grid (8/12) */}
        <div className="lg:col-span-8 depth-1 p-10 rounded-[3rem] relative overflow-hidden group border border-primary/5">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/[0.03] rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none group-hover:bg-primary/[0.05] transition-colors duration-1000" />
          <div className="relative z-10">
            <CalendarGrid 
              year={curYear}
              month={curMonth}
              events={events}
              onDayClick={setSelectedDay}
            />
          </div>
        </div>

        {/* Selected Day Details (4/12) */}
        <div className="lg:col-span-4 space-y-8">
          <div className="depth-1 rounded-[3.5rem] flex flex-col min-h-[600px] relative overflow-hidden shadow-luster border border-primary/5">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary/40 via-primary/60 to-primary/40" />
            
            <div className="p-10 border-b border-primary/5">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-30 mb-2 italic">Entradas del Período</p>
              <h2 className="text-4xl font-black text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tighter leading-none">
                {selectedDay} <span className="text-primary">.</span> <br />
                <span className="text-[0.6em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark uppercase opacity-60 font-bold tracking-widest">{currentDate.toLocaleDateString('es-MX', { month: 'long' })}</span>
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
              {selectedDayEvents.length > 0 ? (
                selectedDayEvents.map(e => (
                  <div key={e.id} className="p-6 depth-2 rounded-[2rem] hover:depth-3 transition-all group scale-in border border-transparent hover:border-primary/10">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-[1.25rem] flex items-center justify-center text-white flex-shrink-0 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform"
                        style={{ backgroundColor: e.color }}>
                        <span className="material-symbols-outlined text-2xl font-light">{e.icon || 'event'}</span>
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark truncate tracking-tight">{e.title}</p>
                        <div className="flex items-center gap-3">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${e.type === 'success' ? 'bg-success/10 text-success' : e.type === 'danger' ? 'bg-danger/10 text-danger' : 'bg-primary/10 text-primary'}`}>
                            {e.type === 'success' ? 'Capital' : e.type === 'danger' ? 'Pasivo' : 'Flujo'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {e.amount !== undefined && (
                      <div className="mt-5 pt-5 border-t border-primary/5 flex justify-between items-end">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-30">Magnitud</span>
                        <span className={`text-lg font-black tabular-nums tracking-tighter ${e.type === 'success' ? 'text-success' : 'text-atelier-text-main-light dark:text-atelier-text-main-dark'}`}>
                          {e.type === 'success' ? '+' : '-'}{formatMXN(e.amount)}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-40">
                  <div className="w-20 h-20 rounded-full depth-2 flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-4xl font-light text-primary">analytics</span>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-atelier-text-main-light dark:text-atelier-text-main-dark">Día de Equilibrio</p>
                  <p className="text-[9px] mt-2 font-medium italic">Sin fluctuaciones registradas</p>
                </div>
              )}
            </div>

            {selectedDayEvents.length > 0 && (
              <div className="p-10 bg-primary/5 border-t border-primary/5">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/60 mb-1">Delta Diario</p>
                    <p className="text-2xl font-black text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tighter tabular-nums">
                      {formatMXN(selectedDayEvents.reduce((acc, e) => acc + (e.type === 'success' ? (e.amount || 0) : -(e.amount || 0)), 0))}
                    </p>
                  </div>
                  <Button variant="ghost" className="!rounded-full px-6 py-2 !text-[9px] font-black uppercase tracking-widest bg-white dark:bg-black shadow-sm">Reporte</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
