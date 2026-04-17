import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useApp } from '../../context/AppContext'
import { Card, Badge, CalendarGrid, type CalendarEvent, Button } from '../../components/ui'
import { formatMXN, formatMXNShort } from '../../types'

const DEBT_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

type Strategy = 'avalancha' | 'bola_de_nieve'

export default function Deudas() {
  const { debts } = useApp()
  const [strategy, setStrategy] = useState<Strategy>('bola_de_nieve')
  const [extraPayment, setExtraPayment] = useState(2500)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const totalDebt = debts.reduce((s, d) => s + d.balance, 0)
  const totalMinPayment = debts.reduce((s, d) => s + d.minimumPayment, 0)
  const totalInterestsMonthly = debts.reduce((s, d) => s + d.balance * (d.interestRate / 12), 0)

  const sortedDebts = useMemo(() => {
    const copy = [...debts]
    return strategy === 'avalancha'
      ? copy.sort((a, b) => b.interestRate - a.interestRate)
      : copy.sort((a, b) => a.balance - b.balance)
  }, [debts, strategy])

  // Events for Calendar
  const events: CalendarEvent[] = useMemo(() => {
    const evs: CalendarEvent[] = []
    debts.forEach((d, idx) => {
      // Payment Event
      evs.push({
        id: `pay-${d.id}`,
        day: d.dueDay,
        title: `Pago: ${d.name}`,
        type: 'danger',
        color: DEBT_COLORS[idx % DEBT_COLORS.length],
        amount: d.minimumPayment
      })
      // Mock Cut-off Event for credit cards (usually 20 days after/before)
      if (d.type === 'tarjeta') {
        const cutDay = ((d.dueDay + 10) % 31) || 1
        evs.push({
          id: `cut-${d.id}`,
          day: cutDay,
          title: `Corte: ${d.name}`,
          type: 'warning',
          color: DEBT_COLORS[idx % DEBT_COLORS.length]
        })
      }
    })
    return evs
  }, [debts])

  const getDiagnostic = (rate: number) => {
    if (rate === 0) return { label: 'Sin interés', variant: 'success' as const }
    if (rate < 0.15) return { label: 'Óptimo', variant: 'success' as const }
    if (rate < 0.25) return { label: 'Manejable', variant: 'info' as const }
    if (rate < 0.35) return { label: 'Elevado', variant: 'warning' as const }
    return { label: 'Crítico', variant: 'danger' as const }
  }

  // Projection logic
  const projectionData = useMemo(() => {
    const months = 6
    return Array.from({ length: months + 1 }, (_, i) => {
      const row: Record<string, number | string> = { month: i === 0 ? 'Hoy' : `+${i}m` }
      debts.forEach(d => {
        const monthlyPmt = d.minimumPayment + (i === 0 ? 0 : extraPayment / debts.length)
        const balance = Math.max(0, d.balance - monthlyPmt * i)
        row[d.name] = Math.round(balance)
      })
      return row
    })
  }, [debts, extraPayment])

  const nextDueDebts = useMemo(() => 
    [...debts].sort((a, b) => a.dueDay - b.dueDay),
    [debts]
  )

  return (
    <div className="space-y-12 animate-fade-in pb-12">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-xs font-bold text-primary uppercase tracking-[0.3em] mb-4 opacity-80">Pasivos y Apalancamiento</p>
          <h1 className="display-lg text-atelier-text-main-light dark:text-atelier-text-main-dark leading-[0.9]">
            Deudas y <br />
            <span className="text-primary/40 text-[0.8em]">Estrategia.</span>
          </h1>
        </div>
        <div className="flex gap-4">
          <Button className="!rounded-full px-8 py-4 !text-[10px] font-black uppercase tracking-widest shadow-luster">
            <span className="material-symbols-outlined text-base font-light mr-2">add</span> Nueva Obligación
          </Button>
        </div>
      </div>

      {/* Primary Row: Calendar and Next Dues */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 depth-1 p-10 rounded-[3rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="flex items-center justify-between mb-10 relative z-10">
            <div>
              <h2 className="text-2xl font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tighter">Cronograma de Vencimientos</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40">Calendario Táctico del Mes</p>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-danger shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 italic">Pago</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-warning shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 italic">Corte</span>
              </div>
            </div>
          </div>
          <div className="relative z-10 bg-atelier-bg-3-light/10 dark:bg-atelier-bg-3-dark/10 rounded-[2.5rem] p-6">
            <CalendarGrid 
              year={2026}
              month={2}
              events={events} 
              onDayClick={setSelectedDay}
            />
          </div>
        </div>

        <div className="lg:col-span-4 depth-1 rounded-[3rem] overflow-hidden flex flex-col border border-primary/5 shadow-luster">
          <div className="p-8 border-b border-primary/5 bg-primary/5">
            <h3 className="text-xl font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tighter flex items-center gap-3">
              <span className="material-symbols-outlined text-primary font-light">event_upcoming</span>
              Próximos Pagos
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide max-h-[500px]">
            {nextDueDebts.map((d, i) => {
              const daysLeft = d.dueDay - new Date().getDate()
              return (
                <div key={d.id} className="flex items-center gap-5 p-5 hover:bg-white/40 dark:hover:bg-black/40 rounded-[2rem] transition-all group">
                  <div className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-white flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: DEBT_COLORS[i % DEBT_COLORS.length] }}>
                    <span className="text-[9px] font-black uppercase opacity-60 leading-none mb-0.5 tracking-widest">Día</span>
                    <span className="text-xl font-black leading-none">{d.dueDay}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark truncate tracking-tight">{d.name}</p>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${daysLeft <= 3 ? 'text-danger' : 'text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 italic'}`}>
                      {daysLeft < 0 ? 'Vencido' : daysLeft === 0 ? '¡Hoy!' : `${daysLeft} DÍAS REST.`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black tabular-nums text-atelier-text-main-light dark:text-atelier-text-main-dark">{formatMXNShort(d.minimumPayment)}</p>
                    <p className="text-[9px] font-black text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-30 uppercase tracking-widest">Mínimo</p>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="p-8 bg-primary/5 border-t border-primary/5">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 mb-1">Carga Mensual</p>
                <p className="text-2xl font-black text-primary tracking-tighter tabular-nums">{formatMXN(totalMinPayment)}</p>
              </div>
              <Button size="sm" variant="ghost" className="!rounded-full px-6 py-2 !text-[9px] font-black uppercase tracking-widest">Historial</Button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI       {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPIItem title="Pasivo Total" value={formatMXN(totalDebt)} icon="account_balance" color="text-danger" bg="bg-danger/10" trend="+2.4%" />
        <KPIItem title="Costo Financiero" value={formatMXN(totalInterestsMonthly)} icon="percent" color="text-warning" bg="bg-warning/10" />
        <KPIItem title="Capacidad de Pago" value="65%" icon="insights" color="text-success" bg="bg-success/10" />
        <KPIItem title="Tasa Promedio" value="24.5%" icon="auto_graph" color="text-primary" bg="bg-primary/10" />
      </div>

      {/* Diagnosis Table */}
      <div className="depth-1 rounded-[3rem] overflow-hidden">
        <div className="px-10 py-8 border-b border-primary/5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tighter">Inventario de Apalancamiento</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40">Desglose Técnico de Tasas y Saldos</p>
          </div>
          <Button variant="ghost" className="!rounded-full px-8 py-3 !text-[9px] font-black uppercase tracking-widest">Auditoría Completa</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-atelier-text-muted-light dark:text-atelier-text-muted-dark font-black uppercase tracking-[0.2em] text-[9px] bg-primary/[0.02]">
                <th className="px-10 py-6 text-left">Institución / Crédito</th>
                <th className="px-10 py-6 text-right">Saldo Vigente</th>
                <th className="px-10 py-6 text-center">Tasa Anual</th>
                <th className="px-10 py-6 text-right">Carga Mensual</th>
                <th className="px-10 py-6 text-center">Health Check</th>
                <th className="px-10 py-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {debts.map(d => {
                const { label, variant } = getDiagnostic(d.interestRate)
                return (
                  <tr key={d.id} className="hover:bg-primary/5 transition-all">
                    <td className="px-10 py-8 font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tight">{d.name}</td>
                    <td className="px-10 py-8 text-right font-black tabular-nums text-danger tracking-tighter text-lg">{formatMXNShort(d.balance)}</td>
                    <td className="px-10 py-8 text-center tabular-nums font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark">
                      {d.interestRate > 0 ? `${(d.interestRate * 100).toFixed(1)}%` : '0%'}
                    </td>
                    <td className="px-10 py-8 text-right tabular-nums text-atelier-text-muted-light dark:text-atelier-text-muted-dark font-medium">{formatMXNShort(d.minimumPayment)}</td>
                    <td className="px-10 py-8 text-center sm:px-4"><Badge variant={variant} className="!rounded-full px-4 py-1 !text-[9px] uppercase font-black tracking-widest">{label}</Badge></td>
                    <td className="px-10 py-8 text-right">
                      <button className="material-symbols-outlined text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 hover:opacity-100 transition-opacity">more_vert</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
       {/* Row: Strategy & Projection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="depth-1 p-10 rounded-[3rem] space-y-10 relative overflow-hidden group">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <h2 className="text-2xl font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tighter">Acelerador Táctico</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40">Optimización de Cascada de Pagos</p>
            </div>
            <div className="flex gap-2 bg-atelier-bg-3-light/50 dark:bg-atelier-bg-3-dark/50 p-1.5 rounded-full">
              {(['bola_de_nieve', 'avalancha'] as Strategy[]).map(s => (
                <button key={s} onClick={() => setStrategy(s)}
                  className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-full transition-all ${
                    strategy === s ? 'bg-primary text-white shadow-luster' : 'text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 hover:opacity-100'
                  }`}>
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
          
          <div className="depth-2 rounded-[2.5rem] p-10 space-y-8">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-xs font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tight italic">Excedente de Capital Mensual</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary leading-none opacity-60">Impacto directo en {sortedDebts[0]?.name}</p>
              </div>
              <span className="text-4xl font-black text-primary tabular-nums tracking-tighter">{formatMXN(extraPayment)}</span>
            </div>
            
            <div className="relative pt-4">
              <input type="range" min={0} max={10000} step={250} value={extraPayment}
                onChange={e => setExtraPayment(Number(e.target.value))}
                className="w-full accent-primary h-2 bg-primary/10 rounded-full appearance-none cursor-pointer" />
              <div className="flex justify-between mt-6 text-[9px] font-black uppercase text-atelier-text-muted-light dark:text-atelier-text-muted-dark tracking-[0.3em] opacity-40">
                <span>Modesto</span>
                <span>Proyectado</span>
                <span>Agresivo</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="p-8 rounded-[2.5rem] bg-success/[0.03] border border-success/10 space-y-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-success opacity-80 italic">Intereses Evitados</p>
              <p className="text-3xl font-black text-success tabular-nums tracking-tighter">{formatMXN(extraPayment * 1.5 * 12)}</p>
            </div>
            <div className="p-8 rounded-[2.5rem] bg-primary/[0.03] border border-primary/10 space-y-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-primary opacity-80 italic">Contracción de Tiempo</p>
              <p className="text-3xl font-black text-primary tabular-nums tracking-tighter">-14 Meses</p>
            </div>
          </div>
        </div>

        {/* Projection Chart */}
        <div className="depth-1 p-10 rounded-[3rem] flex flex-col space-y-10">
          <div>
            <h3 className="text-2xl font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tighter flex items-center gap-4">
              <span className="material-symbols-outlined text-primary font-light text-3xl">analytics</span>
              Libertad Financiera Proyectada
            </h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40">Simulación Térmica de Saldos</p>
          </div>
          <div className="flex-1 min-h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={projectionData}>
                <CartesianGrid strokeDasharray="0" stroke="var(--chart-grid)" vertical={false} opacity={0.05} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--chart-label)', fontWeight: 900 }} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 9, fill: 'var(--chart-label)', fontWeight: 900 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(var(--depth-2), 1)', borderRadius: '24px', border: 'none', padding: '20px', boxShadow: 'var(--shadow-luster)', backdropFilter: 'blur(20px)' }}
                  itemStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
                  formatter={(v: number, name: string) => [formatMXN(v), name]} 
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '2px', paddingTop: '30px', opacity: 0.6 }} />
                {debts.map((d, i) => (
                  <Line key={d.id} type="stepAfter" dataKey={d.name} stroke={DEBT_COLORS[i % DEBT_COLORS.length]} strokeWidth={4} dot={false} animationDuration={2000} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

function KPIItem({ title, value, icon, color, bg, trend }: { title: string; value: string; icon: string; color: string; bg: string; trend?: string }) {
  return (
    <div className="depth-1 p-8 rounded-[2.5rem] transition-all duration-500 hover:depth-2 group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-3xl -mr-12 -mt-12 group-hover:bg-primary/10 transition-colors" />
      <div className="flex items-start justify-between mb-8 relative z-10">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-all duration-700 group-hover:scale-110 group-hover:rotate-[15deg] ${bg}`}>
          <span className={`material-symbols-outlined text-3xl font-light ${color}`}>{icon}</span>
        </div>
        {trend && (
          <span className={`text-[10px] font-black px-4 py-1.5 rounded-full shadow-luster ${trend.startsWith('+') ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-[10px] font-black text-atelier-text-muted-light dark:text-atelier-text-muted-dark uppercase tracking-[0.3em] mb-2 opacity-40 italic">{title}</p>
      <p className={`text-3xl font-black tabular-nums tracking-tighter text-atelier-text-main-light dark:text-atelier-text-main-dark leading-none`}>{value}</p>
    </div>
  )
}
