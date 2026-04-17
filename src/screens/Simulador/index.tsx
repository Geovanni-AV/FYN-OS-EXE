import { useState, useMemo, useEffect } from 'react'
import { AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useApp } from '../../context/AppContext'
import { calcMonthlyPayment, calcAmortizationTable, calcSavingsProjection } from '../../hooks/useFinance'
import { Card, Button, Tabs, Skeleton } from '../../components/ui'
import { formatMXN, formatMXNShort } from '../../types'

type Tab = 'credito' | 'ahorro' | 'deudas'

export default function Simulador() {
  const { debts } = useApp()
  const [tab, setTab] = useState<Tab>('credito')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  // ── Crédito ──────────────────────────────────────────────────────────────────
  const [principal, setPrincipal] = useState(30000)
  const [annualRate, setAnnualRate] = useState(27)
  const [termMonths, setTermMonths] = useState(12)
  const [showFullAmort, setShowFullAmort] = useState(false)

  const creditCalc = useMemo(() => {
    const r = annualRate / 100
    const monthlyPmt = calcMonthlyPayment(principal, r, termMonths)
    const totalPmt = monthlyPmt * termMonths
    const totalInterest = totalPmt - principal
    const cat = (r * 1.15 * 100)
    const amort = calcAmortizationTable(principal, r, termMonths)
    return { monthlyPmt, totalPmt, totalInterest, cat, amort }
  }, [principal, annualRate, termMonths])

  const pieData = [
    { name: 'Capital', value: principal, color: '#2563EB' },
    { name: 'Intereses', value: Math.max(0, creditCalc.totalInterest), color: '#6366F1' },
  ]

  // ── Ahorro ───────────────────────────────────────────────────────────────────
  const [savInitial, setSavInitial] = useState(10000)
  const [savMonthly, setSavMonthly] = useState(3000)
  const [savRate, setSavRate] = useState(8)
  const [savTerm, setSavTerm] = useState(24)

  const savCalc = useMemo(() =>
    calcSavingsProjection(savInitial, savMonthly, savRate / 100, savTerm),
    [savInitial, savMonthly, savRate, savTerm]
  )
  const savFinal = savCalc[savCalc.length - 1]

  // ── Deudas ───────────────────────────────────────────────────────────────────
  const [extraPmt, setExtraPmt] = useState(2000)
  const [debtStrategy, setDebtStrategy] = useState<'avalancha' | 'bola_de_nieve'>('avalancha')

  const debtProjection = useMemo(() => {
    const months = 18
    return Array.from({ length: months + 1 }, (_, i) => {
      const row: Record<string, number | string> = { mes: i === 0 ? 'Hoy' : `M${i}` }
      debts.forEach(d => {
        const pmt = d.minimumPayment + (i === 0 ? 0 : extraPmt / (debts.length || 1))
        const balance = Math.max(0, d.balance - pmt * i)
        row[d.name] = Math.round(balance)
      })
      return row
    })
  }, [debts, extraPmt])

  const DEBT_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444']

  const tabs = [
    { id: 'credito' as Tab, label: 'Crédito',          icon: 'credit_card' },
    { id: 'ahorro'  as Tab, label: 'Ahorro e inversión', icon: 'savings' },
    { id: 'deudas'  as Tab, label: 'Liberación deudas', icon: 'release_alert' },
  ]

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-12 w-full rounded-card" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <Skeleton className="lg:col-span-4 h-[400px] rounded-card" />
          <Skeleton className="lg:col-span-8 h-[400px] rounded-card" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-12 animate-fade-in pb-12">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-xs font-bold text-primary uppercase tracking-[0.3em] mb-4 opacity-80">Herramientas de Precisión</p>
          <h1 className="display-lg text-atelier-text-main-light dark:text-atelier-text-main-dark leading-[0.9]">
            Laboratorio <br />
            <span className="text-primary/40 text-[0.8em]">de Proyección.</span>
          </h1>
        </div>
      </div>

      <div className="flex gap-2 p-1.5 bg-atelier-bg-3-light/50 dark:bg-atelier-bg-3-dark/50 rounded-full w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-3 px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              tab === t.id ? 'bg-white dark:bg-atelier-bg-2-dark shadow-luster text-primary' : 'text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 hover:opacity-100'
            }`}>
            <span className="material-symbols-outlined text-base font-light">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── CRÉDITO ──────────────────────────────────────────────────────────── */}
      {tab === 'credito' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-8">
            <div className="depth-1 p-10 rounded-[3rem] space-y-10 border border-primary/5">
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tighter">Parámetros de Entrada</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40">Configuración Técnica del Préstamo</p>
              </div>

              <div className="space-y-8">
                {[
                  { label: 'Capital Solicitado', value: principal, setter: setPrincipal, min: 5000, max: 500000, step: 5000, fmt: formatMXN },
                  { label: 'Tasa Anual (TNA)', value: annualRate, setter: setAnnualRate, min: 0, max: 100, step: 0.5, fmt: (v: number) => `${v}%` },
                  { label: 'Plazo del Crédito', value: termMonths, setter: setTermMonths, min: 1, max: 60, step: 1, fmt: (v: number) => `${v} MESES` },
                ].map(r => (
                  <div key={r.label} className="space-y-4">
                    <div className="flex justify-between items-end">
                      <label className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 italic">{r.label}</label>
                      <span className="text-lg font-black text-primary tabular-nums tracking-tighter">{r.fmt(r.value)}</span>
                    </div>
                    <input type="range" min={r.min} max={r.max} step={r.step} value={r.value}
                      onChange={e => r.setter(Number(e.target.value))} className="w-full accent-primary h-1.5 bg-primary/10 rounded-full appearance-none cursor-pointer" />
                  </div>
                ))}
              </div>
            </div>

            <div className="depth-1 rounded-[3rem] overflow-hidden border border-primary/5">
              <div className="px-10 py-6 border-b border-primary/5 flex justify-between items-center bg-primary/[0.02]">
                <p className="text-[9px] font-black uppercase text-atelier-text-muted-light dark:text-atelier-text-muted-dark tracking-[0.3em] opacity-40 italic">Tabla de Amortización</p>
                <button onClick={() => setShowFullAmort(s => !s)} className="text-primary text-[9px] font-black uppercase tracking-[0.2em] hover:opacity-70 transition-opacity">
                  {showFullAmort ? 'Contraer' : 'Expandir Todo'}
                </button>
              </div>
              <div className="max-h-[300px] overflow-y-auto scrollbar-hide">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-white dark:bg-atelier-bg-2-dark z-10">
                    <tr className="text-[8px] uppercase text-atelier-text-muted-light dark:text-atelier-text-muted-dark font-black tracking-[0.2em] border-b border-primary/5">
                      <th className="px-10 py-4">Mes</th>
                      <th className="px-10 py-4 text-right">Pago</th>
                      <th className="px-10 py-4 text-right">Interés</th>
                      <th className="px-10 py-4 text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/5">
                    {(showFullAmort ? creditCalc.amort : creditCalc.amort.slice(0, 4)).map(row => (
                      <tr key={row.month} className="hover:bg-primary/5 transition-colors">
                        <td className="px-10 py-5 text-[10px] font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark">M {row.month}</td>
                        <td className="px-10 py-5 text-[10px] text-right tabular-nums text-atelier-text-muted-light dark:text-atelier-text-muted-dark font-medium">{formatMXNShort(row.payment)}</td>
                        <td className="px-10 py-5 text-[10px] text-right tabular-nums text-danger font-black">{formatMXNShort(row.interest)}</td>
                        <td className="px-10 py-5 text-[10px] text-right tabular-nums text-atelier-text-main-light dark:text-atelier-text-main-dark font-black tracking-tighter">{formatMXNShort(row.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="depth-1 p-10 rounded-[3rem] space-y-2 border border-primary/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-30 italic">Mensualidad Calculada</p>
                <p className="text-5xl font-black text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tighter tabular-nums leading-none">
                  {formatMXN(creditCalc.monthlyPmt)}
                </p>
              </div>
              <div className="depth-1 p-10 rounded-[3rem] space-y-2 border border-primary/5 bg-primary/5">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-30 italic">Tasa Real (CAT)</p>
                <div className="flex items-end gap-2">
                  <p className="text-4xl font-black text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tighter tabular-nums leading-none">
                    {creditCalc.cat.toFixed(1)}%
                  </p>
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1">Sin IVA</span>
                </div>
              </div>
            </div>

            <div className="depth-1 p-10 rounded-[3rem] border border-primary/5">
              <div className="flex flex-col md:flex-row items-center gap-12">
                <div className="relative w-56 h-56 flex-shrink-0 group">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-[80px] group-hover:bg-primary/30 transition-colors duration-1000" />
                  <PieChart width={224} height={224}>
                    <Pie data={pieData} cx={112} cy={112} innerRadius={75} outerRadius={105} paddingAngle={4} dataKey="value" stroke="none">
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-30">Costo Total</span>
                    <span className="text-2xl font-black tabular-nums text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tighter leading-none mt-1">{formatMXNShort(creditCalc.totalPmt)}</span>
                  </div>
                </div>
                <div className="flex-1 space-y-8 w-full">
                  <h3 className="text-2xl font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tighter">Composición de Capital</h3>
                  <div className="space-y-6">
                    {[
                      { label: 'Capital Solicitado', value: formatMXN(principal), color: '#2563EB' },
                      { label: 'Carga por Intereses', value: formatMXN(creditCalc.totalInterest), color: '#6366F1' },
                    ].map(r => (
                      <div key={r.label} className="flex items-end justify-between border-b border-primary/5 pb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-5 h-5 rounded-[0.6em]" style={{ background: r.color }} />
                          <span className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark italic opacity-40">{r.label}</span>
                        </div>
                        <span className="text-xl font-black tabular-nums text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tighter">{r.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-end pt-4">
                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Saldo Total Estimado</span>
                    <span className="text-4xl font-black text-primary tracking-tighter tabular-nums leading-none">{formatMXN(creditCalc.totalPmt)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="depth-1 p-8 rounded-[2.5rem] bg-atelier-bg-3-light/30 dark:bg-atelier-bg-3-dark/30 flex gap-6 items-center border border-primary/5 shadow-luster">
              <div className="w-14 h-14 bg-white dark:bg-atelier-bg-2-dark rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border border-primary/5">
                <span className="material-symbols-outlined text-primary text-3xl font-light">tips_and_updates</span>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] leading-none">Insight del Atelier</p>
                <p className="text-xs font-medium text-atelier-text-main-light dark:text-atelier-text-main-dark leading-relaxed">
                  Incrementar la mensualidad en un <span className="text-primary font-black">12.5%</span> colapsa el horizonte de tiempo y reduce la carga financiera en un <span className="text-primary font-black">18.4%</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── AHORRO ───────────────────────────────────────────────────────────── */}
      {tab === 'ahorro' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-8">
            <div className="depth-1 p-10 rounded-[3rem] space-y-10 border border-primary/5">
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tighter">Parámetros de Capitalización</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40">Simulación de Interés Compuesto</p>
              </div>

              <div className="space-y-8">
                {[
                  { label: 'Capital Inicial', value: savInitial, setter: setSavInitial, min: 0, max: 100000, step: 1000, fmt: formatMXN },
                  { label: 'Aportación Recurrente', value: savMonthly, setter: setSavMonthly, min: 0, max: 20000, step: 500, fmt: formatMXN },
                  { label: 'Tasa Anual Esperada', value: savRate, setter: setSavRate, min: 0, max: 20, step: 0.5, fmt: (v: number) => `${v}%` },
                  { label: 'Horizonte de Tiempo', value: savTerm, setter: setSavTerm, min: 6, max: 60, step: 1, fmt: (v: number) => `${v} MESES` },
                ].map(r => (
                  <div key={r.label} className="space-y-4">
                    <div className="flex justify-between items-end">
                      <label className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 italic">{r.label}</label>
                      <span className="text-lg font-black text-primary tabular-nums tracking-tighter">{r.fmt(r.value)}</span>
                    </div>
                    <input type="range" min={r.min} max={r.max} step={r.step} value={r.value}
                      onChange={e => r.setter(Number(e.target.value))} className="w-full accent-primary h-1.5 bg-primary/10 rounded-full appearance-none cursor-pointer" />
                  </div>
                ))}
              </div>

              {savFinal && (
                <div className="pt-10 border-t border-primary/5 space-y-6">
                  <div className="flex justify-between items-end">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40">Capital Aportado</span>
                    <span className="text-lg font-black tabular-nums text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tighter">{formatMXN(savFinal.contributions)}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-success opacity-40">Plusvalía Generada</span>
                    <span className="text-lg font-black tabular-nums text-success tracking-tighter">{formatMXN(Math.max(0, savFinal.interest))}</span>
                  </div>
                  <div className="flex justify-between items-end pt-4">
                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Saldo Final Estimado</span>
                    <span className="text-4xl font-black text-primary tracking-tighter tabular-nums leading-none">{formatMXN(savFinal.balance)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-8 depth-1 p-10 rounded-[3rem] flex flex-col space-y-10 border border-primary/5">
            <div>
              <h3 className="text-2xl font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tighter flex items-center gap-4">
                <span className="material-symbols-outlined text-primary font-light text-3xl">trending_up</span>
                Curva de Acumulación
              </h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 italic">Trayectoria del Patrimonio en el Tiempo</p>
            </div>
            
            <div className="flex-1 min-h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={savCalc.map(r => ({ ...r, month: `M${r.month}` }))}>
                  <defs>
                    <linearGradient id="contribGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} /><stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="intGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} /><stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="0" stroke="var(--chart-grid)" vertical={false} opacity={0.05} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--chart-label)', fontWeight: 900 }} interval={Math.floor(savTerm / 6)} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 9, fill: 'var(--chart-label)', fontWeight: 900 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(var(--depth-2), 1)', borderRadius: '24px', border: 'none', padding: '20px', boxShadow: 'var(--shadow-luster)', backdropFilter: 'blur(20px)' }}
                    itemStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
                    formatter={(v: number, name: string) => [formatMXN(v), name === 'contributions' ? 'Principal' : 'Patrimonio Total']} />
                  <Area type="monotone" dataKey="contributions" stackId="1" stroke="#2563EB" fill="url(#contribGrad)" strokeWidth={4} dot={false} animationDuration={1000} />
                  <Area type="monotone" dataKey="balance" stroke="#10B981" fill="url(#intGrad)" strokeWidth={4} dot={false} animationDuration={1000} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── DEUDAS ───────────────────────────────────────────────────────────── */}
      {tab === 'deudas' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="depth-1 p-10 rounded-[3rem] space-y-2 border border-primary/5 border-l-4 border-l-danger">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-danger opacity-40 italic">Pasivo Acumulado</p>
              <p className="text-4xl font-black tabular-nums text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tighter">
                {formatMXN(debts.reduce((s, d) => s + d.balance, 0))}
              </p>
            </div>
            <div className="depth-1 p-10 rounded-[3rem] space-y-2 border border-primary/5">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-30 italic">Carga de Servicio</p>
              <p className="text-4xl font-black tabular-nums text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tighter">
                {formatMXN(debts.reduce((s, d) => s + d.minimumPayment, 0))}
              </p>
            </div>
            <div className="depth-1 p-10 rounded-[3rem] space-y-2 border border-primary/5 bg-primary/5">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary opacity-40 italic">Inyección Excedente</p>
              <p className="text-4xl font-black tabular-nums text-primary tracking-tighter">
                {formatMXN(extraPmt)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 depth-1 p-10 rounded-[3rem] space-y-10 border border-primary/5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tighter">Vector de Ataque</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 italic">Algoritmo de Priorización</p>
                </div>
              </div>
              <div className="flex gap-2 p-1.5 bg-atelier-bg-3-light/50 dark:bg-atelier-bg-3-dark/50 rounded-full">
                {(['avalancha', 'bola_de_nieve'] as const).map(s => (
                  <button key={s} onClick={() => setDebtStrategy(s)}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-full transition-all ${
                      debtStrategy === s ? 'bg-white dark:bg-atelier-bg-2-dark shadow-luster text-primary' : 'text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 hover:opacity-100'
                    }`}>
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
              <div className="space-y-6 pt-4">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 italic">Empuje Mensual</label>
                  <span className="text-2xl font-black text-primary tabular-nums tracking-tighter">{formatMXN(extraPmt)}</span>
                </div>
                <input type="range" min={0} max={10000} step={500} value={extraPmt}
                  onChange={e => setExtraPmt(Number(e.target.value))} className="w-full accent-primary h-1.5 bg-primary/10 rounded-full appearance-none cursor-pointer" />
              </div>
            </div>

            <div className="lg:col-span-8 depth-1 p-10 rounded-[3rem] border border-primary/5 flex flex-col space-y-10">
              <div>
                <h3 className="text-2xl font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tighter flex items-center gap-4">
                  <span className="material-symbols-outlined text-primary font-light text-3xl">query_stats</span>
                  Simulación de Desapalancamiento
                </h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 italic">Horizonte de Ejecución (18 Meses)</p>
              </div>
              
              <div className="flex-1 min-h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={debtProjection}>
                    <CartesianGrid strokeDasharray="0" stroke="var(--chart-grid)" vertical={false} opacity={0.05} />
                    <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--chart-label)', fontWeight: 900 }} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 9, fill: 'var(--chart-label)', fontWeight: 900 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(var(--depth-2), 1)', borderRadius: '24px', border: 'none', padding: '20px', boxShadow: 'var(--shadow-luster)', backdropFilter: 'blur(20px)' }}
                      itemStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
                      formatter={(v: number, name: string) => [formatMXN(v), name]} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '2px', paddingTop: '30px', opacity: 0.6 }} />
                    {debts.map((d, i) => (
                      <Line key={d.id} type="stepAfter" dataKey={d.name} stroke={DEBT_COLORS[i % DEBT_COLORS.length]} strokeWidth={4} dot={false} animationDuration={1000} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
