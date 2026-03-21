import { useMemo, useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area, Cell
} from 'recharts'
import { useApp } from '../../context/AppContext'
import { Card, Button, Drawer, ChipSelector, Badge, Skeleton } from '../../components/ui'
import { formatMXN, formatMXNShort, CATEGORY_ICONS, CATEGORY_COLORS, CATEGORY_LABELS, type CategoryId } from '../../types'

export default function Analisis() {
  const { transactions, accounts } = useApp()
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  // Statistical calculations
  const analysisData = useMemo(() => {
    const now = new Date()
    const thisMonthStr = now.toISOString().slice(0, 7)
    
    const lastMonthDate = new Date()
    lastMonthDate.setMonth(now.getMonth() - 1)
    const lastMonthStr = lastMonthDate.toISOString().slice(0, 7)
    
    const expensesThisMonth = transactions.filter(t => t.type === 'gasto' && t.date.startsWith(thisMonthStr))
    const expensesLastMonth = transactions.filter(t => t.type === 'gasto' && t.date.startsWith(lastMonthStr))
    
    const totalThis = expensesThisMonth.reduce((sum, t) => sum + t.amount, 0)
    const totalLast = expensesLastMonth.reduce((sum, t) => sum + t.amount, 0)
    
    // Group by category for chart
    const categoryIds = Object.keys(CATEGORY_LABELS) as CategoryId[]
    const catData = categoryIds.map(id => {
      const amount = expensesThisMonth.filter(t => t.category === id).reduce((sum, t) => sum + t.amount, 0)
      return {
        id,
        name: CATEGORY_LABELS[id],
        amount,
        color: CATEGORY_COLORS[id] || '#cbd5e1'
      }
    }).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount)

    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)

    // Trend mock data (last 6 months)
    const trendData = [
      { month: 'Oct', ingresos: 45000, gastos: 32000 },
      { month: 'Nov', ingresos: 48000, gastos: 35000 },
      { month: 'Dic', ingresos: 52000, gastos: 41000 },
      { month: 'Ene', ingresos: 46000, gastos: 38000 },
      { month: 'Feb', ingresos: 45500, gastos: 36500 },
      { month: 'Mar', ingresos: 47000, gastos: totalThis || 34200 }
    ]

    return { totalThis, totalLast, catData, totalBalance, trendData }
  }, [transactions, accounts])

  const handleExport = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      setIsExportOpen(false)
      // Feedback or download logic would go here
    }, 2000)
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    )
  }

  const gastoDiff = analysisData.totalLast > 0 
    ? ((analysisData.totalThis - analysisData.totalLast) / analysisData.totalLast) * 100 
    : 0

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-light-text dark:text-dark-text tracking-tight uppercase">
            Análisis y Reportes
          </h1>
          <p className="text-light-text-2 dark:text-dark-text-2 text-sm mt-1">
            Visualiza el rendimiento de tu patrimonio y hábitos de consumo.
          </p>
        </div>
        <Button onClick={() => setIsExportOpen(true)} className="gap-2">
          <span className="material-symbols-outlined text-lg">download</span>
          Exportar
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-5xl">shopping_cart</span>
          </div>
          <p className="text-xs font-bold text-light-muted dark:text-dark-muted uppercase tracking-widest mb-1">Gasto Total Mes</p>
          <h2 className="text-2xl font-black text-light-text dark:text-dark-text tabular-nums">
            {formatMXN(analysisData.totalThis)}
          </h2>
          <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${gastoDiff > 0 ? 'text-danger' : 'text-success'}`}>
            <span className="material-symbols-outlined text-sm">{gastoDiff > 0 ? 'trending_up' : 'trending_down'}</span>
            {Math.abs(Math.round(gastoDiff))}% vs mes anterior
          </div>
        </Card>

        <Card className="relative overflow-hidden group border-l-4 border-l-primary">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-5xl">account_balance_wallet</span>
          </div>
          <p className="text-xs font-bold text-light-muted dark:text-dark-muted uppercase tracking-widest mb-1">Balance Consolidado</p>
          <h2 className="text-2xl font-black text-light-text dark:text-dark-text tabular-nums">
            {formatMXN(analysisData.totalBalance)}
          </h2>
          <Badge variant="info" className="mt-2">Patrimonio Neto</Badge>
        </Card>

        <Card className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-5xl">savings</span>
          </div>
          <p className="text-xs font-bold text-light-muted dark:text-dark-muted uppercase tracking-widest mb-1">Ahorro Proyectado</p>
          <h2 className="text-2xl font-black text-success tabular-nums">
            {formatMXN(analysisData.totalBalance * 0.12)}
          </h2>
          <p className="text-[10px] text-light-muted dark:text-dark-muted mt-2 italic font-medium">Estimado basado en excedente histórico.</p>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-light-text dark:text-dark-text flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">show_chart</span>
              Tendencia de Flujo
            </h3>
            <Badge variant="neutral">Últimos 6 meses</Badge>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analysisData.trendData}>
                <defs>
                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1}/>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis hide />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#f8fafc' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="ingresos" stroke="#22c55e" fillOpacity={1} fill="url(#colorIngresos)" strokeWidth={3} />
                <Area type="monotone" dataKey="gastos" stroke="#ef4444" fillOpacity={1} fill="url(#colorGastos)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-light-text dark:text-dark-text flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">donut_large</span>
              Gastos por Categoría
            </h3>
            <select className="bg-transparent text-xs font-bold border-none text-primary focus:ring-0 cursor-pointer outline-none">
              <option>Este Mes</option>
              <option>Mes Pasado</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysisData.catData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.1}/>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={100} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }}
                  formatter={(val: number) => formatMXNShort(val)}
                />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={20}>
                  {analysisData.catData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Intelligent Insights */}
      <div className="pt-4">
        <h3 className="text-lg font-bold text-light-text dark:text-dark-text mb-4 uppercase tracking-tighter flex items-center gap-2">
          <span className="material-symbols-outlined text-warning animate-pulse">lightbulb</span>
          Insights Inteligentes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card border border-primary/20 p-4 rounded-card flex gap-4 items-start hover:border-primary/40 transition-colors">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
              <span className="material-symbols-outlined">auto_fix_high</span>
            </div>
            <div>
              <p className="font-bold text-sm text-light-text dark:text-dark-text">Optimización de Suscripciones</p>
              <p className="text-xs text-light-muted dark:text-dark-muted mt-1">Has gastado <span className="text-primary font-bold">{formatMXN(1240)}</span> en servicios digitales este mes. Podrías ahorrar un 15% consolidando planes familiares.</p>
            </div>
          </div>
          <div className="glass-card border border-success/20 p-4 rounded-card flex gap-4 items-start hover:border-success/40 transition-colors">
            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0 text-success">
              <span className="material-symbols-outlined">trending_up</span>
            </div>
            <div>
              <p className="font-bold text-sm text-light-text dark:text-dark-text">Potencial de Inversión</p>
              <p className="text-xs text-light-muted dark:text-dark-muted mt-1">Tu excedente actual te permitiría invertir <span className="text-success font-bold">$3,500</span> en un fondo de bajo riesgo sin afectar tu liquidez.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Export Drawer */}
      <Drawer
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title="Generar Reporte"
      >
        <div className="space-y-8">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-primary mb-4">Formato de Archivo</p>
            <ChipSelector
              options={[
                { value: 'pdf', label: 'PDF Ejecutivo', icon: 'picture_as_pdf' },
                { value: 'excel', label: 'Excel Estructurado', icon: 'table_view' },
                { value: 'csv', label: 'Dataset CSV', icon: 'description' }
              ]}
              value={exportFormat}
              onChange={setExportFormat}
            />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-widest text-primary mb-4">Rango de Datos</p>
            <div className="grid grid-cols-1 gap-3">
              <button className="flex items-center justify-between p-3 rounded-card border border-light-border dark:border-dark-border hover:bg-light-surface dark:hover:bg-dark-surface transition-all text-sm font-medium">
                Últimos 30 días <span className="text-xs text-primary">Recomendado</span>
              </button>
              <button className="flex items-center justify-between p-3 rounded-card border border-light-border dark:border-dark-border hover:bg-light-surface dark:hover:bg-dark-surface transition-all text-sm font-medium">
                Mes actual (Marzo)
              </button>
              <button className="flex items-center justify-between p-3 rounded-card border border-light-border dark:border-dark-border hover:bg-light-surface dark:hover:bg-dark-surface transition-all text-sm font-medium">
                Personalizado...
              </button>
            </div>
          </div>

          <div className="bg-light-surface dark:bg-dark-surface p-4 rounded-card border-l-4 border-l-primary">
            <p className="text-[10px] text-light-muted dark:text-dark-muted leading-tight">
              El reporte incluirá un desglose detallado de todas las transacciones, gráficas de tendencia y un resumen del balance consolidado.
            </p>
          </div>

          <Button 
            className="w-full py-4 h-auto uppercase tracking-tighter font-black" 
            onClick={handleExport}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <span className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generando...
              </span>
            ) : (
              `Descargar ${exportFormat.toUpperCase()}`
            )}
          </Button>
        </div>
      </Drawer>
    </div>
  )
}
