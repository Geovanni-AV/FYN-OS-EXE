import { useState, useMemo, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useApp } from '../../context/AppContext'
import { calcSavingsProjection } from '../../hooks/useFinance'
import { Card, GoalGauge, Badge, Modal, Drawer, Button, Input, Skeleton } from '../../components/ui'
import { formatMXN, formatMXNShort } from '../../types'
import type { SavingGoal } from '../../types'

const GOAL_TYPES = [
  { value: 'emergencia', label: 'Emergencia', icon: 'shield' },
  { value: 'viaje',      label: 'Viaje',      icon: 'flight' },
  { value: 'auto',       label: 'Auto',       icon: 'directions_car' },
  { value: 'casa',       label: 'Casa',       icon: 'home' },
  { value: 'educacion',  label: 'Educación',  icon: 'school' },
  { value: 'retiro',     label: 'Retiro',     icon: 'elderly' },
  { value: 'otro',       label: 'Otro',       icon: 'category' },
] as const

const GOAL_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316']

export default function Metas() {
  const { goals, addGoal } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [activeGoal, setActiveGoal] = useState<SavingGoal | null>(null)
  const [sliderTerm, setSliderTerm] = useState(12)
  const [sliderRate, setSliderRate] = useState(8)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  // New goal form
  const [newName, setNewName] = useState('')
  const [newTarget, setNewTarget] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newContrib, setNewContrib] = useState('')
  const [newType, setNewType] = useState<SavingGoal['type']>('otro')

  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0)

  const drawerProjection = useMemo(() => {
    if (!activeGoal) return []
    return calcSavingsProjection(activeGoal.currentAmount, activeGoal.monthlyContribution, activeGoal.expectedReturn, 24)
      .map(r => ({ month: `+${r.month}m`, real: r.balance, objetivo: activeGoal.targetAmount }))
  }, [activeGoal])

  const handleCreateGoal = () => {
    if (!newName || !newTarget) return
    addGoal({
      name: newName, type: newType,
      targetAmount: parseFloat(newTarget),
      currentAmount: 0,
      targetDate: newDate || new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
      monthlyContribution: parseFloat(newContrib) || 0,
      expectedReturn: sliderRate / 100,
      color: GOAL_COLORS[goals.length % GOAL_COLORS.length],
      icon: GOAL_TYPES.find(t => t.value === newType)?.icon ?? 'category',
    })
    setShowModal(false)
    setNewName(''); setNewTarget(''); setNewDate(''); setNewContrib('')
  }

  const getGoalStatus = (g: SavingGoal) => {
    const pct = g.currentAmount / g.targetAmount
    if (pct >= 1) return { label: 'Completada', variant: 'success' as const }
    if (pct >= 0.7) return { label: 'En progreso', variant: 'info' as const }
    if (new Date(g.targetDate) < new Date()) return { label: 'Vencida', variant: 'danger' as const }
    return { label: 'En progreso', variant: 'neutral' as const }
  }

  return (
    <div className="space-y-12 animate-fade-in pb-12">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-xs font-bold text-primary uppercase tracking-[0.3em] mb-4 opacity-80">Proyección y Aspiración</p>
          <h1 className="display-lg text-atelier-text-main-light dark:text-atelier-text-main-dark">
            Metas de <br />
            <span className="text-primary/40">Acumulación.</span>
          </h1>
        </div>
        <div className="flex gap-4">
          <Button onClick={() => setShowModal(true)} className="!rounded-full !px-8 shadow-luster">
            <span className="material-symbols-outlined text-lg">add</span>
            Nueva Meta
          </Button>
        </div>
      </div>

      {/* Portfolio Savings Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-60">Capital Acumulado en Metas</p>
          <p className="text-6xl lg:text-7xl font-black text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tighter tabular-nums">
            {formatMXN(totalSaved)}
          </p>
          <div className="flex items-center gap-4">
            <Badge variant="success" className="px-4 py-1 rounded-full uppercase text-[9px] font-black tracking-widest">Ahorro Activo</Badge>
            <p className="text-[11px] font-bold text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 uppercase tracking-widest">{goals.length} Objetivos Identificados</p>
          </div>
        </div>
        <div className="lg:col-span-7 flex flex-col justify-end space-y-4">
           <div className="h-px w-full bg-primary/10" />
           <p className="text-sm text-atelier-text-muted-light dark:text-atelier-text-muted-dark font-medium italic opacity-60 max-w-lg leading-relaxed">
             La persistencia en el flujo de capital hacia tus metas es el factor determinante en la salud de tu patrimonio futuro. Mantén tus aportes programados.
           </p>
        </div>
      </div>

      {/* Goals grid Editorial */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-8">
        {goals.map(g => {
          const pct = Math.min((g.currentAmount / g.targetAmount) * 100, 100)
          const { label, variant } = getGoalStatus(g)
          return (
            <Card key={g.id} padding={false} onClick={() => setActiveGoal(g)}
              className="group p-8 space-y-8 hover:!depth-2 !rounded-[3rem] cursor-pointer transition-all active:scale-[0.98] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
              
              <div className="flex justify-between items-start relative z-10">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm bg-white/5 border border-white/10"
                  style={{ color: g.color }}>
                  <span className="material-symbols-outlined text-2xl font-light">{g.icon}</span>
                </div>
                <Badge variant={variant} className="!rounded-full px-3 py-1 text-[8px] font-black uppercase tracking-widest">
                  {label}
                </Badge>
              </div>

              <div className="space-y-1 relative z-10">
                <h3 className="text-xl font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tight">{g.name}</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40">
                  Target: {new Date(g.targetDate).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}
                </p>
              </div>

              <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-end">
                  <p className="text-2xl font-black text-atelier-text-main-light dark:text-atelier-text-main-dark tabular-nums tracking-tighter">{formatMXNShort(g.currentAmount)}</p>
                  <p className="text-[11px] font-black text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 uppercase tracking-widest">de {formatMXNShort(g.targetAmount)}</p>
                </div>
                <div className="h-2 w-full bg-atelier-bg-3-light dark:bg-atelier-bg-3-dark rounded-full overflow-hidden p-0.5">
                  <div className="h-full rounded-full transition-all duration-1000 ease-out shadow-luster"
                    style={{ width: `${pct}%`, backgroundColor: g.color }} />
                </div>
              </div>

              <div className="pt-6 border-t border-primary/10 flex justify-between items-center relative z-10">
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40">Compromiso Mensual</p>
                  <p className="text-sm font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark tabular-nums">{formatMXNShort(g.monthlyContribution)}</p>
                </div>
                <span className="text-lg font-black text-primary tabular-nums tracking-tighter">{Math.round(pct)}%</span>
              </div>
            </Card>
          )
        })}

        {/* Add goal editorial link */}
        <button onClick={() => setShowModal(true)}
          className="rounded-[3rem] depth-1 border-2 border-dashed border-primary/10 flex flex-col items-center justify-center gap-4 p-8 hover:border-primary/40 hover:depth-2 transition-all cursor-pointer min-h-[300px] group">
          <div className="w-16 h-16 rounded-full depth-1 flex items-center justify-center group-hover:depth-2 transition-all">
            <span className="material-symbols-outlined text-3xl font-light text-primary">add</span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-60">Nuevo Objetivo</span>
        </button>
      </div>

      {/* Modal Nueva Meta Editorial */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Originación de Objetivo" size="md">
        <div className="space-y-12 pb-8">
          <p className="text-sm text-atelier-text-muted-light dark:text-atelier-text-muted-dark font-medium italic opacity-60">Define un nuevo horizonte de acumulación para tu portafolio.</p>

          <div className="space-y-8">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-60">Categorización</h3>
            <div className="grid grid-cols-4 gap-3">
              {GOAL_TYPES.map(t => (
                <button key={t.value} onClick={() => setNewType(t.value)}
                  className={`flex flex-col items-center gap-3 p-4 rounded-2xl transition-all ${
                    newType === t.value
                      ? 'depth-2 bg-primary/10 text-primary'
                      : 'depth-1 text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 hover:opacity-100'
                  }`}>
                  <span className="material-symbols-outlined text-xl font-light">{t.icon}</span>
                  <span className="text-[8px] font-black uppercase tracking-widest">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-60">Parámetros Técnicos</h3>
            <div className="space-y-10">
              <input type="text" className="w-full bg-transparent border-b border-primary/20 py-4 px-1 text-base font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark focus:outline-none placeholder:opacity-20 transition-all focus:border-primary" 
                placeholder="Identificador del Objetivo" value={newName} onChange={e => setNewName(e.target.value)} />
              
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 italic">Monto Target</p>
                  <input type="number" className="w-full bg-transparent border-none py-2 text-3xl font-black text-atelier-text-main-light dark:text-atelier-text-main-dark focus:outline-none placeholder:opacity-10 tracking-tighter" 
                    placeholder="0.00" value={newTarget} onChange={e => setNewTarget(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 italic text-right">Horizonte</p>
                  <input type="date" className="w-full bg-transparent border-none py-2 text-base font-black text-atelier-text-main-light dark:text-atelier-text-main-dark focus:outline-none text-right" 
                    value={newDate} onChange={e => setNewDate(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 italic">Aportación Periódica Mensual</p>
                <input type="number" className="w-full bg-transparent border-none py-2 text-2xl font-black text-primary focus:outline-none placeholder:opacity-10 tracking-tighter" 
                  placeholder="0.00" value={newContrib} onChange={e => setNewContrib(e.target.value)} />
              </div>

              <div className="space-y-6 pt-4">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-60">
                  <span>Rendimiento Anual Target</span>
                  <span className="text-primary">{sliderRate}%</span>
                </div>
                <input type="range" min={0} max={15} step={0.5} value={sliderRate}
                  onChange={e => setSliderRate(Number(e.target.value))} className="w-full h-1 bg-primary/10 rounded-full appearance-none cursor-pointer accent-primary" />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-8">
            <button className="flex-1 text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity" onClick={() => setShowModal(false)}>Cancelar</button>
            <Button size="lg" className="flex-[2] justify-center !rounded-full py-5 text-[10px] font-black uppercase tracking-[0.3em] shadow-luster" 
              onClick={handleCreateGoal} disabled={!newName || !newTarget}>Confirmar Originación</Button>
          </div>
        </div>
      </Modal>

      {/* Drawer Detalle Editorial */}
      <Drawer isOpen={activeGoal !== null} onClose={() => setActiveGoal(null)} title="Proyección de Capital" width={520}>
        {activeGoal && (
          <div className="space-y-12 pb-12">
            <div className="flex items-center gap-8">
              <div className="w-20 h-20 rounded-[2rem] depth-2 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundColor: activeGoal.color }} />
                <span className="material-symbols-outlined text-4xl font-light scale-110" style={{ color: activeGoal.color }}>{activeGoal.icon}</span>
              </div>
              <div>
                <h3 className="text-2xl font-black text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tight">{activeGoal.name}</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 mt-1">Estatus: {getGoalStatus(activeGoal).label}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 depth-1 rounded-[2rem] space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Monto Nominal</p>
                <p className="text-xl font-black tabular-nums tracking-tighter">{formatMXNShort(activeGoal.targetAmount)}</p>
              </div>
              <div className="p-6 depth-1 rounded-[2rem] space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Fecha Target</p>
                <p className="text-xl font-black uppercase tracking-tighter text-atelier-text-main-light dark:text-atelier-text-main-dark">
                  {new Date(activeGoal.targetDate).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex justify-between items-end">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-60">Matriz de Proyección</h3>
                <span className="text-[10px] font-black text-primary uppercase tracking-widest italic">Interés Compuesto: {(activeGoal.expectedReturn * 100).toFixed(1)}%</span>
              </div>
              <div className="h-[220px] w-full depth-1 rounded-[2.5rem] p-8">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={drawerProjection}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.1} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9CA3AF' }} />
                    <YAxis hide />
                    <Tooltip cursor={{ stroke: activeGoal.color, strokeDasharray: '4 4' }} contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '12px', fontSize: '10px' }} />
                    <Line type="monotone" dataKey="real" stroke={activeGoal.color} strokeWidth={3} dot={false} animationDuration={1000} />
                    <Line type="monotone" dataKey="objetivo" stroke="#9CA3AF" strokeWidth={1} strokeDasharray="6 6" dot={false} opacity={0.3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-6">
               <div className="flex justify-between items-center px-4">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">Asignación Mensual</p>
                  <p className="text-lg font-black tabular-nums tracking-tighter">{formatMXN(activeGoal.monthlyContribution)}</p>
               </div>
               <div className="flex gap-4">
                 <Button variant="secondary" className="flex-1 justify-center py-4 !rounded-full !text-[10px] uppercase font-black tracking-[0.2em]">Pausar Flujo</Button>
                 <Button className="flex-[2] justify-center py-4 !rounded-full !text-[10px] uppercase font-black tracking-[0.2em] shadow-luster">Consolidar Capital</Button>
               </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
