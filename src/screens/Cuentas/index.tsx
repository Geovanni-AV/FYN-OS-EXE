import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { formatMXN, ACCOUNT_ICONS } from '../../types'
import { Card, Button, Badge, Modal, Input, Drawer, EmptyState } from '../../components/ui'

export default function Cuentas() {
  const { accounts, totalBalance } = useApp()
  const [selectedAccount, setSelectedAccount] = useState<any>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const handleOpenDetail = (acc: any) => {
    setSelectedAccount(acc)
    setIsDetailOpen(true)
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-light-text dark:text-dark-text tracking-tight uppercase">Mis Cuentas</h1>
          <p className="text-light-text-2 dark:text-dark-text-2 text-sm mt-1">Gestiona tu capital, tarjetas y activos.</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined text-xl">add</span>
          Nueva Cuenta
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {accounts.length > 0 ? (
          accounts.map(acc => (
            <Card 
              key={acc.id} 
              clickable 
              onClick={() => handleOpenDetail(acc)}
              className="relative overflow-hidden group border-b-2 border-b-transparent hover:border-b-primary"
            >
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="w-7 h-7 flex items-center justify-center rounded-full bg-light-surface/80 dark:bg-dark-surface/80 text-light-muted hover:text-primary">
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-btn bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">{ACCOUNT_ICONS[acc.type] || 'account_balance'}</span>
                </div>
                <div>
                  <h3 className="font-bold text-light-text dark:text-dark-text leading-tight">{acc.name}</h3>
                  <p className="text-[10px] text-light-muted dark:text-dark-muted font-bold tracking-widest uppercase">{acc.type}</p>
                </div>
              </div>
              
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-tighter">Saldo Disponible</p>
                <div className="text-xl font-black text-light-text dark:text-dark-text tabular-nums">
                  {formatMXN(acc.balance)}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-light-border/30 dark:border-dark-border/30 flex justify-between items-center">
                <Badge variant={acc.balance > 0 ? 'success' : 'danger'}>
                  {acc.balance > 0 ? 'Activa' : 'Sin fondo'}
                </Badge>
                <span className="text-[10px] text-light-muted dark:text-dark-muted font-medium">Auto-Sync</span>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
             <EmptyState 
               icon="account_balance"
               title="No hay cuentas"
               description="Agrega tu primera cuenta bancaria o billetera para empezar a trackear tu efectivo."
               action={<Button onClick={() => setIsAddModalOpen(true)}>Crear ahora</Button>}
             />
          </div>
        )}
      </div>

      {/* Resumen Patrimonial Simple */}
      <Card className="bg-primary/5 dark:bg-primary/5 border-primary/20 p-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-1">Capital Total Consolidado</p>
          <div className="text-3xl font-black text-light-text dark:text-dark-text tabular-nums">{formatMXN(totalBalance)}</div>
        </div>
        <div className="hidden md:flex flex-col items-end">
           <Badge variant="info" className="mb-2">Auditoría en curs</Badge>
           <p className="text-[10px] text-light-muted dark:text-dark-muted italic">Última sincronización: Hace 2 min</p>
        </div>
      </Card>

      {/* Modales y Drawers */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Nueva Cuenta">
        <div className="space-y-4">
          <Input label="Nombre de la Cuenta" placeholder="Ej. BBVA Débito" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Monto Inicial" placeholder="$0.00" type="number" />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-light-text dark:text-dark-text">Tipo de Cuenta</label>
              <select className="w-full bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-btn px-3 py-2.5 text-sm">
                <option>Efectivo</option>
                <option>Banco</option>
                <option>Inversión</option>
                <option>Crypto</option>
              </select>
            </div>
          </div>
          <Button className="w-full mt-2 py-3">Guardar Cuenta</Button>
        </div>
      </Modal>

      <Drawer isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Detalles de Cuenta">
        {selectedAccount && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 shadow-inner">
                <span className="material-symbols-outlined text-4xl">{ACCOUNT_ICONS[selectedAccount.type]}</span>
              </div>
              <h2 className="text-xl font-bold text-light-text dark:text-dark-text">{selectedAccount.name}</h2>
              <Badge variant="info" className="mt-2 text-[10px] uppercase font-bold tracking-widest">{selectedAccount.type}</Badge>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="p-4 rounded-card bg-light-surface dark:bg-dark-surface border border-light-border/30 dark:border-dark-border/30">
                <p className="text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-tighter mb-1">Saldo Real</p>
                <div className="text-2xl font-black text-primary">{formatMXN(selectedAccount.balance)}</div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-light-text dark:text-dark-text mb-4">Acciones Rápidas</h3>
              <Button variant="secondary" className="w-full justify-start gap-3">
                <span className="material-symbols-outlined text-lg">history</span>
                Ver Historial Completo
              </Button>
              <Button variant="secondary" className="w-full justify-start gap-3">
                <span className="material-symbols-outlined text-lg">sync</span>
                Sincronizar Manualmente
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 text-danger hover:bg-danger/5 border-danger/30">
                <span className="material-symbols-outlined text-lg uppercase">delete</span>
                Eliminar Registro
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
