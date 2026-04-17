import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useApp } from '../../context/AppContext'
import { useDashboardKPIs, useRecentTransactions } from '../../hooks/useFinance'
import { Card, Badge, ProgressBar, GoalGauge, Button } from '../../components/ui'
import {
  formatMXN, formatMXNShort, formatPercent,
  CATEGORY_ICONS, CATEGORY_LABELS, CATEGORY_COLORS,
  getBudgetStatus,
} from '../../types'

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-card p-3 shadow-lg text-sm">
      {label && <p className="text-light-text-2 dark:text-dark-text-2 text-xs mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-semibold tabular-nums text-light-text dark:text-dark-text">
          {formatMXN(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { accounts, budgets, goals, netWorthHistory, profile } = useApp()
  const kpis = useDashboardKPIs()
  const recent = useRecentTransactions(6)
  const [aiBannerOpen, setAiBannerOpen] = useState(true)

  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 19) return 'Buenas tardes'
    return 'Buenas noches'
  }, [])

  const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const topGoal = useMemo(() =>
    [...goals].sort((a, b) => (b.currentAmount / b.targetAmount) - (a.currentAmount / a.targetAmount))[0],
    [goals]
  )

  const chartData = useMemo(() =>
    netWorthHistory.slice(-6).map(n => ({
      month: n.month.slice(5),
      netWorth: n.netWorth,
    })),
    [netWorthHistory]
  )

  // Health badge
  const healthColor = kpis.porcentajeGastado < 0.7 ? 'success' : kpis.porcentajeGastado < 0.9 ? 'warning' : 'danger'
  const healthLabel = kpis.porcentajeGastado < 0.7 ? 'Salud financiera: Buena' : kpis.porcentajeGastado < 0.9 ? 'Atención' : 'Alerta'

  return (
    <div className="space-y-12 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-xs font-bold text-primary uppercase tracking-[0.3em] mb-4 opacity-80">Panorama General</p>
          <h1 className="display-lg text-atelier-text-main-light dark:text-atelier-text-main-dark">
            {greeting},<br />
            <span className="text-primary/40">{profile.name.split(' ')[0]}.</span>
          </h1>
        </div>
        <div className="flex flex-col items-start md:items-end gap-2">
          <p className="text-sm font-semibold text-atelier-text-muted-light dark:text-atelier-text-muted-dark italic opacity-60 uppercase tracking-widest leading-none">{today}</p>
          <div className="h-px w-12 bg-primary/20 mt-2" />
        </div>
      </div>

      {/* Hero Section: The Golden Number */}
      <div className="relative group">
        <div className="absolute -inset-4 bg-primary/5 rounded-[3rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        <div className="relative">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark mb-4">Capital Total Neto</p>
          <div className="flex flex-col lg:flex-row lg:items-end gap-6 lg:gap-12">
            <p className="text-6xl lg:text-8xl font-black tabular-nums tracking-tighter text-atelier-text-main-light dark:text-atelier-text-main-dark">
              {formatMXN(kpis.totalBalance)}
            </p>
            <div className="flex flex-col gap-3 pb-2">
              <div className="flex items-center gap-3">
                <Badge variant={healthColor} className="px-4 py-1 rounded-full uppercase text-[10px] tracking-widest font-black">
                  {healthLabel}
                </Badge>
              </div>
              <p className="text-[11px] text-atelier-text-muted-light dark:text-atelier-text-muted-dark font-bold uppercase tracking-widest">
                Sincronizado: hace 4 min
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sparkline Editorial */}
      <div className="w-full h-32 -mx-4 lg:-mx-10 opacity-60 hover:opacity-100 transition-opacity duration-700">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 0, right: 40, left: 40, bottom: 0 }}>
            <defs>
              <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-label)" stopOpacity={0.1} />
                <stop offset="100%" stopColor="var(--chart-label)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey="netWorth" 
              stroke="var(--chart-label)" 
              strokeWidth={1.5} 
              fill="url(#heroGrad)" 
              dot={false} 
              activeDot={{ r: 4, fill: '#0058bc' }} 
              animationDuration={1500} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Layered KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Ingresos', value: kpis.ingresos, icon: 'keyboard_double_arrow_up', color: 'text-success' },
          { label: 'Gastos',   value: kpis.gastos,   icon: 'keyboard_double_arrow_down', color: 'text-danger' },
          { label: 'Inversiones', value: kpis.ahorro, icon: 'account_balance', color: 'text-primary' },
          { label: 'Eficiencia', value: null, pct: kpis.tasaAhorro, icon: 'monitoring', color: 'text-primary' },
        ].map(kpi => (
          <Card key={kpi.label} padding={false} className="p-8 hover:!depth-2">
            <div className="flex flex-col gap-6">
              <span className={`material-symbols-outlined text-3xl font-light ${kpi.color}`}>{kpi.icon}</span>
              <div className="space-y-1">
                <p className="text-[10px] text-atelier-text-muted-light dark:text-atelier-text-muted-dark uppercase tracking-[0.2em] font-black">{kpi.label}</p>
                <p className="text-3xl font-bold tabular-nums text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tight">
                  {kpi.pct !== undefined ? formatPercent(kpi.pct) : formatMXNShort(kpi.value!)}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Termómetro de gastos */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-light-text dark:text-dark-text">Presupuesto del mes</h3>
          <Link to="/presupuestos">
            <span className="text-xs text-primary font-medium hover:underline cursor-pointer">Ver detalle</span>
          </Link>
        </div>
        <div className="space-y-2">
          <ProgressBar
            value={kpis.gastos}
            max={kpis.presupuestoTotal}
            color={kpis.porcentajeGastado > 0.9 ? '#EF4444' : kpis.porcentajeGastado > 0.7 ? '#F59E0B' : '#10B981'}
            ghost={kpis.gastosProyectados}
          />
          <div className="flex justify-between text-xs text-light-text-2 dark:text-dark-text-2">
            <span>Gastado: <span className="font-semibold tabular-nums text-light-text dark:text-dark-text">{formatMXNShort(kpis.gastos)}</span></span>
            <span>Proyección: <span className={`font-semibold tabular-nums ${kpis.gastosProyectados > kpis.presupuestoTotal ? 'text-danger' : 'text-warning'}`}>{formatPercent(kpis.gastosProyectados / (kpis.presupuestoTotal || 1))}</span></span>
            <span>Límite: <span className="font-semibold tabular-nums text-light-text dark:text-dark-text">{formatMXNShort(kpis.presupuestoTotal)}</span></span>
          </div>
        </div>
      </Card>

      {/* No-Line Lists: Transactions & Accounts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Movimientos */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark">Movimientos Editoriales</h3>
            <Link to="/analisis" className="text-[10px] font-bold text-primary uppercase tracking-widest hover:opacity-70 transition-opacity">Ver registro completo</Link>
          </div>
          <div className="space-y-1">
            {recent.map(tx => (
              <div key={tx.id} className="flex items-center gap-6 p-4 rounded-2xl hover:depth-1 transition-all group active:scale-[0.99]">
                <div className="w-12 h-12 rounded-full depth-1 flex items-center justify-center flex-shrink-0 group-hover:depth-2 group-hover:shadow-sm transition-all">
                  <span className="material-symbols-outlined text-2xl font-light" style={{ color: CATEGORY_COLORS[tx.category] }}>
                    {CATEGORY_ICONS[tx.category]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark truncate tracking-tight">{tx.description}</p>
                  <p className="text-[11px] text-atelier-text-muted-light dark:text-atelier-text-muted-dark uppercase tracking-widest font-black mt-0.5 opacity-60">
                    {new Date(tx.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <p className={`text-base font-bold tabular-nums flex-shrink-0 tracking-tighter ${tx.type === 'ingreso' ? 'text-success' : 'text-atelier-text-main-light dark:text-atelier-text-main-dark'}`}>
                  {tx.type === 'ingreso' ? '+' : '-'}{formatMXNShort(tx.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Cuentas mini */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark">Cartera de Activos</h3>
            <Link to="/cuentas" className="text-[10px] font-bold text-primary uppercase tracking-widest hover:opacity-70 transition-opacity">Ver carteras</Link>
          </div>
          <div className="space-y-4">
            {accounts.filter(a => a.isActive).slice(0, 4).map(acc => (
              <Card key={acc.id} padding={false} className="p-5 hover:!depth-2 !rounded-3xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-black shadow-sm"
                    style={{ backgroundColor: acc.color }}>
                    {acc.bank.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark truncate tracking-tight">{acc.name}</p>
                    <p className="text-[10px] text-atelier-text-muted-light dark:text-atelier-text-muted-dark uppercase tracking-widest font-medium opacity-60">Institución: {acc.bank}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black tabular-nums tracking-tight text-atelier-text-main-light dark:text-atelier-text-main-dark">
                      {formatMXNShort(acc.balance)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Presupuestos & Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-8">
        {/* Presupuestos */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark">Eficiencia Presupuestal</h3>
            <Link to="/presupuestos" className="text-[10px] font-bold text-primary uppercase tracking-widest hover:opacity-70 transition-opacity">Optimizar Presupuestos</Link>
          </div>
          <div className="space-y-6">
            {budgets.slice(0, 5).map(b => {
              const pct = b.monthlyLimit > 0 ? b.spent / b.monthlyLimit : 0
              const status = getBudgetStatus(b)
              const color = status === 'ok' ? '#006e28' : status === 'warning' ? '#bc6c00' : '#bc000a'
              return (
                <div key={b.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-lg" style={{ color }}>
                        {CATEGORY_ICONS[b.category]}
                      </span>
                      <span className="text-sm font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tight">{CATEGORY_LABELS[b.category]}</span>
                    </div>
                    <span className="text-[11px] font-black text-atelier-text-muted-light dark:text-atelier-text-muted-dark uppercase tracking-widest tabular-nums font-secondary">
                      {formatMXNShort(b.spent)} <span className="opacity-30">/</span> {formatMXNShort(b.monthlyLimit)}
                    </span>
                  </div>
                  <ProgressBar value={b.spent} max={b.monthlyLimit} color={color} />
                </div>
              )
            })}
          </div>
        </div>

        {/* Goal Highlight */}
        {topGoal && (
          <div className="space-y-8">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark">Meta Maestra</h3>
            <Card className="flex flex-col items-center text-center p-8 !rounded-[2.5rem] !depth-2">
              <GoalGauge
                percentage={(topGoal.currentAmount / topGoal.targetAmount) * 100}
                color={topGoal.color}
                size={120}
              />
              <p className="mt-8 text-xl font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tight">{topGoal.name}</p>
              <div className="h-0.5 w-8 bg-primary/20 my-4" />
              <p className="text-sm font-black tabular-nums text-primary tracking-widest uppercase">
                {formatMXNShort(topGoal.currentAmount)} <span className="opacity-30">/</span> {formatMXNShort(topGoal.targetAmount)}
              </p>
              <Link to="/metas" className="mt-8 text-[10px] font-black text-atelier-text-muted-light dark:text-atelier-text-muted-dark uppercase tracking-[0.2em] hover:text-primary transition-colors">Portafolio Completo</Link>
            </Card>
          </div>
        )}
      </div>

      {/* Banner IA Editorial */}
      {aiBannerOpen && (
        <div className="glass depth-2 p-8 !rounded-[2.5rem] flex items-start gap-8 animate-fade-in-up relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-primary/10 transition-colors" />
          <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center flex-shrink-0 shadow-luster">
            <span className="material-symbols-outlined text-white text-3xl font-light">auto_awesome</span>
          </div>
          <div className="flex-1 min-w-0 space-y-4 relative z-10">
            <p className="text-[10px] font-black tracking-[0.4em] text-primary uppercase">Asistente de Capital</p>
            <p className="text-lg font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark leading-snug tracking-tight">
              Análisis de suscripciones terminado.
              <span className="block text-atelier-text-muted-light dark:text-atelier-text-muted-dark font-medium mt-2">
                Detectamos redundancias en entretenimiento. Cancelar servicios duplicados optimizaría tu flujo en <span className="text-success font-black tabular-nums">$488 MXN</span> mensuales.
              </span>
            </p>
            <div className="flex gap-4">
              <Button size="sm" className="!px-6 !py-2.5">Optimizar Ahora</Button>
              <button onClick={() => setAiBannerOpen(false)} className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark hover:text-atelier-text-main-light transition-colors">Ignorar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
