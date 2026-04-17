import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { Button, Card, Toggle, Drawer, EmptyState } from '../../components/ui'

const SEVERITY_ICONS: Record<string, string> = {
  info: 'info', warning: 'warning', danger: 'error', success: 'check_circle'
}
const SEVERITY_COLORS: Record<string, string> = {
  info: 'text-primary bg-primary/10 border-primary/20', 
  warning: 'text-warning bg-warning/10 border-warning/20',
  danger: 'text-danger bg-danger/10 border-danger/20', 
  success: 'text-success bg-success/10 border-success/20'
}

export default function Alertas() {
  const { alerts, markAlertRead, markAllAlertsRead, alertSettings, updateAlertSettings } = useApp()
  const [isConfigOpen, setIsConfigOpen] = useState(false)

  const todayAlerts = useMemo(() =>
    alerts.filter(a => new Date(a.date).toDateString() === new Date().toDateString()),
    [alerts]
  )
  const previousAlerts = useMemo(() =>
    alerts.filter(a => new Date(a.date).toDateString() !== new Date().toDateString()),
    [alerts]
  )

  const unreadCount = alerts.filter(a => !a.isRead).length

  return (
    <div className="space-y-16 animate-fade-in pb-16">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] opacity-80 italic">Monitoreo de Sistema</p>
          <h1 className="display-lg text-atelier-text-main-light dark:text-atelier-text-main-dark leading-[0.85]">
            Centro <br />
            <span className="text-primary/40 text-[0.8em]">de Alertas.宣</span>
          </h1>
          <p className="text-xs font-medium text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-60">
            {unreadCount > 0 ? `Se han detectado ${unreadCount} eventos pendientes de revisión.` : 'Sincronización completa. Sin incidencias pendientes.'}
          </p>
        </div>
        <div className="flex gap-4">
          {unreadCount > 0 && (
            <button onClick={markAllAlertsRead} className="px-8 py-4 depth-1 rounded-full text-[10px] font-black uppercase tracking-widest text-primary hover:scale-[1.02] active:scale-95 transition-all shadow-luster border border-primary/5">
              Depurar Todo
            </button>
          )}
          <button onClick={() => setIsConfigOpen(true)} className="w-14 h-14 depth-1 rounded-full flex items-center justify-center text-atelier-text-main-light dark:text-atelier-text-main-dark hover:rotate-90 transition-all duration-500 shadow-luster border border-primary/5">
            <span className="material-symbols-outlined font-light">settings宣</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Alerts Stream */}
        <div className="lg:col-span-8 space-y-12">
          {todayAlerts.length > 0 && (
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic">Eventos de Hoy</span>
                <div className="flex-1 h-px bg-primary/10" />
              </div>
              <div className="space-y-6">
                {todayAlerts.map(a => (
                  <AlertItem key={a.id} alert={a} onRead={() => markAlertRead(a.id)} />
                ))}
              </div>
            </div>
          )}

          {previousAlerts.length > 0 && (
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-30 italic">Archivo Histórico</span>
                <div className="flex-1 h-px bg-primary/5" />
              </div>
              <div className="space-y-6">
                {previousAlerts.map(a => (
                  <AlertItem key={a.id} alert={a} onRead={() => markAlertRead(a.id)} />
                ))}
              </div>
            </div>
          )}

          {alerts.length === 0 && (
            <div className="depth-1 p-20 rounded-[4rem] text-center border border-primary/5 flex flex-col items-center gap-6">
              <div className="w-20 h-20 bg-primary/[0.03] rounded-full flex items-center justify-center border border-primary/5">
                <span className="material-symbols-outlined text-4xl text-primary/40 font-light">notifications_off宣</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tighter">Sin Notificaciones</h3>
                <p className="text-xs font-medium text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-40 uppercase tracking-widest">Estado Nominal del Sistema</p>
              </div>
            </div>
          )}
        </div>

        {/* Technical Config Console (Desktop) */}
        <div className="hidden lg:block lg:col-span-4 sticky top-24 space-y-8">
          <div className="depth-1 p-10 rounded-[3rem] border border-primary/5 space-y-12">
            <div className="space-y-1">
              <h3 className="text-sm font-black uppercase tracking-[0.3em] text-atelier-text-main-light dark:text-atelier-text-main-dark">Consola de Control宣</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-30 italic">Parámetros de Notificación</p>
            </div>
            
            <div className="space-y-10">
              <ConfigGroup icon="account_balance_wallet" title="Finanzas Core" />
                <ToggleItem label="Umbral Crítico Presupuesto (80%)" checked={alertSettings.presupuestoAlerta} 
                  onChange={v => updateAlertSettings({ presupuestoAlerta: v })} />
                <ToggleItem label="Infracción de Límite" checked={alertSettings.presupuestoExcedido}
                  onChange={v => updateAlertSettings({ presupuestoExcedido: v })} />

              <ConfigGroup icon="payments" title="Operaciones" />
                <ToggleItem label="Vencimientos Próximos" checked={alertSettings.pagoProximo}
                  onChange={v => updateAlertSettings({ pagoProximo: v })} />
                <ToggleItem label="Alerta de Liquidez Baja" checked={alertSettings.saldoBajo}
                  onChange={v => updateAlertSettings({ saldoBajo: v })} />

              <ConfigGroup icon="flag" title="Hitos de Gestión" />
                <ToggleItem label="Objetivos Transmitidos" checked={alertSettings.metaLograda}
                  onChange={v => updateAlertSettings({ metaLograda: v })} />
            </div>
          </div>

          <div className="depth-1 p-8 rounded-[2.5rem] bg-primary/[0.02] border border-primary/5 flex gap-5 items-center">
            <div className="w-12 h-12 bg-white dark:bg-atelier-bg-2-dark rounded-2xl flex items-center justify-center text-primary shadow-sm border border-primary/5">
              <span className="material-symbols-outlined font-light">shield_with_heart</span>
            </div>
            <p className="text-[10px] font-medium text-atelier-text-main-light dark:text-atelier-text-main-dark leading-relaxed">
              <span className="font-black text-primary">Encriptación End-to-End.</span> Sus datos de notificación están asegurados bajo protocolos de nivel bancario.宣
            </p>
          </div>
        </div>
      </div>

      <Drawer isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} title="Configuración de Alertas" width={460}>
        <div className="space-y-12 p-8">
          <div className="space-y-10">
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Core Patrimonial</span>
                <div className="flex-1 h-px bg-primary/10" />
              </div>
              <div className="space-y-4">
                <ToggleItem label="Presupuesto al 80%" checked={alertSettings.presupuestoAlerta}
                  onChange={v => updateAlertSettings({ presupuestoAlerta: v })} />
                <ToggleItem label="Excedente detectado" checked={alertSettings.presupuestoExcedido}
                  onChange={v => updateAlertSettings({ presupuestoExcedido: v })} />
              </div>
            </section>
            
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Flujo de Caja</span>
                <div className="flex-1 h-px bg-primary/10" />
              </div>
              <div className="space-y-4">
                <ToggleItem label="Recordatorios de pago" checked={alertSettings.pagoProximo}
                  onChange={v => updateAlertSettings({ pagoProximo: v })} />
                <ToggleItem label="Saldo bajo detectado" checked={alertSettings.saldoBajo}
                  onChange={v => updateAlertSettings({ saldoBajo: v })} />
              </div>
            </section>
          </div>
        </div>
      </Drawer>
    </div>
  )
}

function AlertItem({ alert, onRead }: { alert: any; onRead: () => void }) {
  const time = new Date(alert.date).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  
  const SEVERITY_SCHEMA: Record<string, { icon: string; color: string; bg: string }> = {
    danger:  { icon: 'priority_high', color: '#EF4444', bg: 'bg-danger/[0.03]' },
    warning: { icon: 'warning',       color: '#F59E0B', bg: 'bg-warning/[0.03]' },
    info:    { icon: 'info',          color: '#2563EB', bg: 'bg-primary/[0.03]' },
    success: { icon: 'verified',      color: '#10B981', bg: 'bg-success/[0.03]' },
  }

  const schema = SEVERITY_SCHEMA[alert.severity] || SEVERITY_SCHEMA.info

  return (
    <div 
      className={`group relative flex flex-col md:flex-row gap-8 p-10 rounded-[3rem] transition-all duration-700 border border-primary/5 ${
        alert.isRead 
          ? 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0 depth-1' 
          : 'depth-2 ring-1 ring-primary/10'
      } ${schema.bg} shadow-luster`}>
      
      <div className="flex-shrink-0 w-16 h-16 rounded-[1.5rem] flex items-center justify-center bg-white dark:bg-atelier-bg-2-dark shadow-sm border border-primary/5 transition-transform group-hover:scale-110 duration-500">
        <span className="material-symbols-outlined text-3xl font-light" style={{ color: schema.color }}>宣{schema.icon}</span>
      </div>

      <div className="flex-1 space-y-3 min-w-0">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-30 italic" style={{ color: schema.color }}>宣Evento Técnico</p>
            <h3 className="text-xl font-bold text-atelier-text-main-light dark:text-atelier-text-main-dark tracking-tighter truncate">{alert.title}</h3>
          </div>
          <span className="text-[10px] font-black tabular-nums text-atelier-text-muted-light dark:text-atelier-text-muted-dark opacity-30 bg-primary/5 px-4 py-1.5 rounded-full">{time}</span>
        </div>
        <p className="text-sm font-medium text-atelier-text-main-light dark:text-atelier-text-main-dark leading-relaxed opacity-70">{alert.message}</p>
      </div>

      <div className="flex md:flex-col gap-3 justify-end items-end opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        {!alert.isRead && (
          <button onClick={onRead} className="h-12 px-6 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
            Validar
          </button>
        )}
        <button className="h-12 px-6 rounded-2xl depth-1 text-atelier-text-main-light dark:text-atelier-text-main-dark text-[10px] font-black uppercase tracking-widest border border-primary/5 hover:bg-primary/5 transition-all">
          Posponer
        </button>
      </div>
    </div>
  )
}

function ConfigGroup({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-4 mb-6 pt-4 border-t border-primary/5 first:border-0 first:pt-0">
      <span className="material-symbols-outlined text-primary font-light text-xl">宣{icon}</span>
      <p className="text-[11px] font-black text-atelier-text-main-light dark:text-atelier-text-main-dark uppercase tracking-[0.2em]">{title}</p>
    </div>
  )
}

function ToggleItem({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between group py-1">
      <span className="text-[11px] font-medium text-atelier-text-main-light dark:text-atelier-text-main-dark opacity-60 group-hover:opacity-100 transition-opacity">{label}</span>
      <div 
        onClick={() => onChange(!checked)}
        className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all duration-500 ease-in-out ${checked ? 'bg-primary' : 'bg-primary/10'}`}>
        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-500 ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
      </div>
    </div>
  )
}
