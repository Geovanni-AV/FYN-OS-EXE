import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useApp } from '../../context/AppContext'
import { useNetWorth } from '../../hooks/useFinance'
import { Card, Skeleton, Button } from '../../components/ui'
import { formatMXN, formatMXNShort } from '../../types'

export default function NetWorth() {
  const { accounts, netWorthHistory } = useApp()
  const { assets, liabilities, netWorth } = useNetWorth()
  const [range, setRange] = useState<'3m' | '6m' | '1y'>('1y')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="p-4 lg:p-12 space-y-12 animate-fade-in">
        <div className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-16 w-96 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="lg:col-span-2 h-64 rounded-[3rem]" />
          <div className="flex flex-col gap-6">
            <Skeleton className="h-32 rounded-[3rem]" />
            <Skeleton className="h-32 rounded-[3rem]" />
          </div>
        </div>
        <Skeleton className="h-96 w-full rounded-[3rem]" />
      </div>
    )
  }

  const chartData = netWorthHistory
    .slice(range === '3m' ? -3 : range === '6m' ? -6 : -12)
    .map(n => ({
      month: n.month.slice(5) + '/' + n.month.slice(2, 4),
      activos: n.assets,
      pasivos: n.liabilities,
      netWorth: n.netWorth,
    }))

  const activeAccounts = accounts.filter(a => a.isActive && a.balance > 0)
  const liabilityAccounts = accounts.filter(a => a.isActive && a.balance < 0)

  return (
    <div className="space-y-16 animate-fade-in pb-16">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] opacity-80 italic">Manifiesto Financiero</p>
          <h1 className="display-lg text-atelier-text-main-light dark:text-atelier-text-main-dark leading-[0.85]">
            Patrimonio <br />
            <span className="text-primary/40 text-[0.8em]">Neto.</span>
          </h1>
        </div>
        <button className="flex items-center gap-4 px-8 py-4 depth-1 rounded-full text-[10px] font-black uppercase tracking-widest text-primary hover:scale-[1.02] active:scale-95 transition-all shadow-luster border border-primary/5">
          <span className="material-symbols-outlined text-lg font-light">ios_share</span>
          Exportar Reporte
        </button>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-8 depth-1 p-12 rounded-[3.5rem] relative overflow-hidden flex flex-col justify-between border border-primary/5 min-h-[320px]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/[0.03] rounded-full blur-[100px] -mr-48 -mt-48" />
          <div className="relative z-10">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-30 italic mb-4">Capital Consolidado</p>
            <p className={`text-7xl md:text-8xl font-black tabular-nums tracking-tighter leading-none ${netWorth < 0 ? 'text-danger' : 'text-atelier-text-main-light dark:text-atelier-text-main-dark'}`}>
              {formatMXN(netWorth)}
            </p>
          </div>
          <div className="relative z-10 flex flex-wrap gap-12 mt-12 border-t border-primary/5 pt-8">
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-success/50">Activos Totales</span>
              <p className="text-2xl font-black text-success tabular-nums tracking-tight">{formatMXNShort(assets)}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-danger/50">Pasivos Totales</span>
              <p className="text-2xl font-black text-danger tabular-nums tracking-tight">{formatMXNShort(liabilities)}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/50">Margen Solvencia</span>
              <p className="text-2xl font-black text-primary tabular-nums tracking-tight">{((netWorth / assets) * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="flex-1 depth-1 p-10 rounded-[3rem] border border-primary/5 flex flex-col justify-center gap-2">
            <span className="material-symbols-outlined text-success text-3xl font-light mb-2">account_balance_wallet</span>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-30 italic">Poder de Liquidez</p>
            <p className="text-3xl font-black text-atelier-text-main-light dark:text-atelier-text-main-dark tabular-nums tracking-tighter">{formatMXNShort(assets)}</p>
          </div>
          <div className="flex-1 depth-1 p-10 rounded-[3rem] border border-primary/5 bg-danger/[0.02] flex flex-col justify-center gap-2">
            <span className="material-symbols-outlined text-danger text-3xl font-light mb-2">credit_card_off</span>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-danger opacity-30 italic">Compromisos</p>
            <p className="text-3xl font-black text-danger tabular-nums tracking-tighter">{formatMXNShort(liabilities)}</p>
          </div>
        </div>
      </div>

      {/* Historical Evolution Area Chart */}
      <div className="depth-1 p-12 rounded-[3.5rem] border border-primary/5 space-y-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tighter">Trayectoria del Patrimonio</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 italic">Serie Histórica Consolidada</p>
          </div>
          <div className="flex gap-2 p-1.5 bg-atelier-bg-3-light/50 dark:bg-atelier-bg-3-dark/50 rounded-full w-fit">
            {(['3m', '6m', '1y'] as const).map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-6 py-2 text-[9px] font-black uppercase tracking-widest rounded-full transition-all ${
                  range === r ? 'bg-white dark:bg-atelier-bg-2-dark shadow-luster text-primary' : 'text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 hover:opacity-100'
                }`}>
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[450px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15} /><stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="assetGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} /><stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="0" stroke="var(--chart-grid)" vertical={false} opacity={0.05} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--chart-label)', fontWeight: 900 }} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 9, fill: 'var(--chart-label)', fontWeight: 900 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(var(--depth-2), 1)', borderRadius: '24px', border: 'none', padding: '24px', boxShadow: 'var(--shadow-luster)', backdropFilter: 'blur(20px)' }}
                itemStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
                formatter={(v: number, name: string) => [formatMXN(v), name.toUpperCase()]} />
              <Area type="monotone" dataKey="activos" stroke="#10B981" fill="url(#assetGrad)" strokeWidth={3} strokeDasharray="8 8" dot={false} animationDuration={1200} />
              <Area type="monotone" dataKey="netWorth" stroke="var(--primary)" fill="url(#nwGrad)" strokeWidth={5} dot={false} animationDuration={1000} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Manifest Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Activos - Detailed */}
        <div className="depth-1 rounded-[3.5rem] overflow-hidden border border-primary/5">
          <div className="p-10 border-b border-primary/5 flex items-center justify-between bg-success/[0.02]">
            <h3 className="text-xl font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tighter">Posiciones de Activo</h3>
            <span className="text-xl font-black text-success tabular-nums tracking-tighter">{formatMXNShort(assets)}</span>
          </div>
          <div className="divide-y divide-primary/5 h-[400px] overflow-y-auto scrollbar-hide">
            {activeAccounts.map(acc => (
              <div key={acc.id} className="p-8 flex items-center justify-between hover:bg-primary/[0.02] transition-colors">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xs font-black shadow-lg"
                    style={{ backgroundColor: acc.color, boxShadow: `0 8px 16px ${acc.color}20` }}>{acc.bank.slice(0, 2)}</div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40">{acc.type}</p>
                    <p className="text-sm font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark">{acc.name}</p>
                  </div>
                </div>
                <p className="text-lg font-black tabular-nums text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tighter">{formatMXNShort(acc.balance)}</p>
              </div>
            ))}
            {/* Added Manual Asset Example */}
            <div className="p-8 flex items-center justify-between bg-primary/[0.03]">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-atelier-bg-2-dark flex items-center justify-center border border-primary/10">
                  <span className="material-symbols-outlined text-primary font-light">home</span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40">Bienes Raíces</p>
                  <p className="text-sm font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark">Valuación Inmuebles</p>
                </div>
              </div>
              <p className="text-lg font-black tabular-nums text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tighter">$2,800,000</p>
            </div>
          </div>
        </div>

        {/* Pasivos - Detailed */}
        <div className="depth-1 rounded-[3.5rem] overflow-hidden border border-primary/5">
          <div className="p-10 border-b border-primary/5 flex items-center justify-between bg-danger/[0.02]">
            <h3 className="text-xl font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tighter">Obligaciones Vigentes</h3>
            <span className="text-xl font-black text-danger tabular-nums tracking-tighter">{formatMXNShort(liabilities)}</span>
          </div>
          <div className="divide-y divide-primary/5 h-[400px] overflow-y-auto scrollbar-hide">
            {liabilityAccounts.length > 0 ? liabilityAccounts.map(acc => (
              <div key={acc.id} className="p-8 border-l-4 border-l-danger flex items-center justify-between hover:bg-danger/[0.02] transition-colors">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xs font-black shadow-lg"
                    style={{ backgroundColor: acc.color, boxShadow: `0 8px 16px ${acc.color}20` }}>{acc.bank.slice(0, 2)}</div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-danger opacity-40 italic">{acc.type}</p>
                    <p className="text-sm font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark">{acc.name}</p>
                  </div>
                </div>
                <p className="text-lg font-black tabular-nums text-danger tracking-tighter">{formatMXNShort(Math.abs(acc.balance))}</p>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-30">
                <span className="material-symbols-outlined text-5xl font-light mb-4">verified</span>
                <p className="text-xs font-black uppercase tracking-[0.3em]">Sin Obligaciones Pendientes</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Technical Equation - Modernist Footer */}
      <div className="depth-1 p-16 rounded-[4rem] text-center space-y-12 border border-primary/5 bg-primary/[0.02] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-primary/10 hidden md:block" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-30 italic">Activos</p>
            <p className="text-4xl font-black text-success tabular-nums tracking-tight">{formatMXNShort(assets)}</p>
          </div>
          <div className="w-12 h-12 rounded-full border border-primary/20 flex items-center justify-center bg-white dark:bg-atelier-bg-3-dark text-2xl font-light text-primary shadow-luster">−</div>
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-30 italic">Pasivos</p>
            <p className="text-4xl font-black text-danger tabular-nums tracking-tight">{formatMXNShort(liabilities)}</p>
          </div>
          <div className="w-12 h-12 rounded-full border border-primary/20 flex items-center justify-center bg-white dark:bg-atelier-bg-3-dark text-2xl font-light text-primary shadow-luster">＝</div>
          <div className="depth-2 p-8 md:p-12 rounded-[3.5rem] border border-primary/10 shadow-luster scale-110">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic mb-2">Net Worth</p>
            <p className={`text-5xl font-black tabular-nums tracking-tighter ${netWorth < 0 ? 'text-danger' : 'text-atelier-text-main-light dark:text-atelier-text-main-dark'}`}>
              {formatMXN(netWorth)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
