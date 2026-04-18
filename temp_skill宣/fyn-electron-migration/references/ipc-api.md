# Contrato IPC — API completa de window.electronAPI

Este archivo define todos los canales IPC que deben existir en:
- `electron/preload.ts` → `contextBridge.exposeInMainWorld('electronAPI', { ... })`
- `electron/handlers/*.ts` → `ipcMain.handle('canal', handler)`
- `src/types/electron.d.ts` → declaración de tipos para el renderer

---

## Convención de nombres de canales

```
db:<entidad>:<accion>     → operaciones de base de datos
pdf:<accion>              → procesamiento de PDFs
dialog:<accion>           → diálogos nativos del OS
settings:<accion>         → configuración de la app
data:<evento>             → eventos del main → renderer
```

---

## API Completa

### Perfil

| Canal IPC | Parámetros | Retorna |
|-----------|-----------|---------|
| `db:profile:get` | — | `UserProfile \| null` |
| `db:profile:create` | `{ name, email? }` | `UserProfile` |
| `db:profile:update` | `Partial<UserProfile>` | `UserProfile` |

### Cuentas

| Canal IPC | Parámetros | Retorna |
|-----------|-----------|---------|
| `db:accounts:getAll` | — | `Account[]` |
| `db:accounts:create` | `Omit<Account, 'id'>` | `Account` |
| `db:accounts:update` | `id: string, updates: Partial<Account>` | `Account` |
| `db:accounts:delete` | `id: string` | `void` |

### Transacciones

| Canal IPC | Parámetros | Retorna |
|-----------|-----------|---------|
| `db:transactions:getAll` | — | `Transaction[]` |
| `db:transactions:create` | `Omit<Transaction, 'id'>` | `Transaction` |
| `db:transactions:delete` | `id: string` | `void` |
| `db:transactions:bulkCreate` | `Omit<Transaction, 'id'>[]` | `{ inserted: number, duplicates: number }` |

### Presupuestos

| Canal IPC | Parámetros | Retorna |
|-----------|-----------|---------|
| `db:budgets:getAll` | — | `Budget[]` (con `spent` calculado) |
| `db:budgets:upsert` | `Omit<Budget, 'id' \| 'spent'>` | `Budget` |
| `db:budgets:getSpent` | `category: string, period: string` | `number` |

### Metas de Ahorro

| Canal IPC | Parámetros | Retorna |
|-----------|-----------|---------|
| `db:goals:getAll` | — | `SavingGoal[]` |
| `db:goals:create` | `Omit<SavingGoal, 'id'>` | `SavingGoal` |
| `db:goals:update` | `id: string, updates: Partial<SavingGoal>` | `SavingGoal` |
| `db:goals:delete` | `id: string` | `void` |

### Deudas

| Canal IPC | Parámetros | Retorna |
|-----------|-----------|---------|
| `db:debts:getAll` | — | `Debt[]` |
| `db:debts:create` | `Omit<Debt, 'id'>` | `Debt` |
| `db:debts:update` | `id: string, updates: Partial<Debt>` | `Debt` |
| `db:debts:delete` | `id: string` | `void` |

### Alertas

| Canal IPC | Parámetros | Retorna |
|-----------|-----------|---------|
| `db:alerts:getAll` | — | `Alert[]` |
| `db:alerts:markRead` | `id: string` | `void` |
| `db:alerts:markAllRead` | — | `void` |
| `db:alerts:getSettings` | — | `AlertSettings` |
| `db:alerts:updateSettings` | `Partial<AlertSettings>` | `AlertSettings` |

### Net Worth

| Canal IPC | Parámetros | Retorna |
|-----------|-----------|---------|
| `db:networth:getHistory` | — | `NetWorthSnapshot[]` |
| `db:networth:upsert` | `Omit<NetWorthSnapshot, nunca>` | `void` |

### PDF

| Canal IPC | Parámetros | Retorna |
|-----------|-----------|---------|
| `pdf:parse` | `filePath: string, bankId: string, accountId: string` | `{ success: boolean, transactions: ParsedTransaction[], count: number }` |

### Diálogos Nativos

| Canal IPC | Parámetros | Retorna |
|-----------|-----------|---------|
| `dialog:openFile` | — | `string \| null` (path del archivo) |

### Configuración

| Canal IPC | Parámetros | Retorna |
|-----------|-----------|---------|
| `settings:getApiKey` | — | `string` |
| `settings:setApiKey` | `key: string` | `void` |

### Eventos del Main → Renderer (listeners, no invoke)

| Evento | Payload | Descripción |
|--------|---------|-------------|
| `data:changed` | `entityType: string` | Main notifica al renderer que recargue datos |

---

## Implementación del preload (estructura)

```typescript
// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Perfil
  getProfile: () => ipcRenderer.invoke('db:profile:get'),
  createProfile: (data: any) => ipcRenderer.invoke('db:profile:create', data),
  updateProfile: (data: any) => ipcRenderer.invoke('db:profile:update', data),

  // Cuentas
  getAccounts: () => ipcRenderer.invoke('db:accounts:getAll'),
  createAccount: (data: any) => ipcRenderer.invoke('db:accounts:create', data),
  updateAccount: (id: string, data: any) => ipcRenderer.invoke('db:accounts:update', id, data),
  deleteAccount: (id: string) => ipcRenderer.invoke('db:accounts:delete', id),

  // Transacciones
  getTransactions: () => ipcRenderer.invoke('db:transactions:getAll'),
  createTransaction: (data: any) => ipcRenderer.invoke('db:transactions:create', data),
  deleteTransaction: (id: string) => ipcRenderer.invoke('db:transactions:delete', id),
  bulkCreateTransactions: (data: any[]) => ipcRenderer.invoke('db:transactions:bulkCreate', data),

  // Presupuestos
  getBudgets: () => ipcRenderer.invoke('db:budgets:getAll'),
  upsertBudget: (data: any) => ipcRenderer.invoke('db:budgets:upsert', data),
  getBudgetSpent: (category: string, period: string) => 
    ipcRenderer.invoke('db:budgets:getSpent', category, period),

  // Metas
  getGoals: () => ipcRenderer.invoke('db:goals:getAll'),
  createGoal: (data: any) => ipcRenderer.invoke('db:goals:create', data),
  updateGoal: (id: string, data: any) => ipcRenderer.invoke('db:goals:update', id, data),
  deleteGoal: (id: string) => ipcRenderer.invoke('db:goals:delete', id),

  // Deudas
  getDebts: () => ipcRenderer.invoke('db:debts:getAll'),
  createDebt: (data: any) => ipcRenderer.invoke('db:debts:create', data),
  updateDebt: (id: string, data: any) => ipcRenderer.invoke('db:debts:update', id, data),
  deleteDebt: (id: string) => ipcRenderer.invoke('db:debts:delete', id),

  // Alertas
  getAlerts: () => ipcRenderer.invoke('db:alerts:getAll'),
  markAlertRead: (id: string) => ipcRenderer.invoke('db:alerts:markRead', id),
  markAllAlertsRead: () => ipcRenderer.invoke('db:alerts:markAllRead'),
  getAlertSettings: () => ipcRenderer.invoke('db:alerts:getSettings'),
  updateAlertSettings: (data: any) => ipcRenderer.invoke('db:alerts:updateSettings', data),

  // Net Worth
  getNetWorthHistory: () => ipcRenderer.invoke('db:networth:getHistory'),
  upsertNetWorth: (data: any) => ipcRenderer.invoke('db:networth:upsert', data),

  // PDF
  parsePDF: (filePath: string, bankId: string, accountId: string) =>
    ipcRenderer.invoke('pdf:parse', filePath, bankId, accountId),

  // Dialog
  showOpenDialog: () => ipcRenderer.invoke('dialog:openFile'),

  // Settings
  getApiKey: () => ipcRenderer.invoke('settings:getApiKey'),
  setApiKey: (key: string) => ipcRenderer.invoke('settings:setApiKey', key),

  // Eventos (listener pattern)
  onDataChanged: (callback: (entity: string) => void) => {
    const handler = (_: any, entity: string) => callback(entity)
    ipcRenderer.on('data:changed', handler)
    return handler
  },
  offDataChanged: (handler: any) => {
    ipcRenderer.removeListener('data:changed', handler)
  },
})
```

---

## Declaración de tipos `src/types/electron.d.ts`

```typescript
import type {
  Account, Transaction, Budget, SavingGoal, Debt,
  Alert, AlertSettings, NetWorthSnapshot, UserProfile
} from './index'

interface ParsedTransaction {
  date: string
  amount: number
  type: 'gasto' | 'ingreso'
  description: string
}

interface Window {
  electronAPI: {
    // Perfil
    getProfile: () => Promise<UserProfile | null>
    createProfile: (data: { name: string; email?: string }) => Promise<UserProfile>
    updateProfile: (data: Partial<UserProfile>) => Promise<UserProfile>

    // Cuentas
    getAccounts: () => Promise<Account[]>
    createAccount: (data: Omit<Account, 'id'>) => Promise<Account>
    updateAccount: (id: string, data: Partial<Account>) => Promise<Account>
    deleteAccount: (id: string) => Promise<void>

    // Transacciones
    getTransactions: () => Promise<Transaction[]>
    createTransaction: (data: Omit<Transaction, 'id'>) => Promise<Transaction>
    deleteTransaction: (id: string) => Promise<void>
    bulkCreateTransactions: (data: Omit<Transaction, 'id'>[]) => Promise<{ inserted: number; duplicates: number }>

    // Presupuestos
    getBudgets: () => Promise<Budget[]>
    upsertBudget: (data: Omit<Budget, 'id' | 'spent'>) => Promise<Budget>
    getBudgetSpent: (category: string, period: string) => Promise<number>

    // Metas
    getGoals: () => Promise<SavingGoal[]>
    createGoal: (data: Omit<SavingGoal, 'id'>) => Promise<SavingGoal>
    updateGoal: (id: string, data: Partial<SavingGoal>) => Promise<SavingGoal>
    deleteGoal: (id: string) => Promise<void>

    // Deudas
    getDebts: () => Promise<Debt[]>
    createDebt: (data: Omit<Debt, 'id'>) => Promise<Debt>
    updateDebt: (id: string, data: Partial<Debt>) => Promise<Debt>
    deleteDebt: (id: string) => Promise<void>

    // Alertas
    getAlerts: () => Promise<Alert[]>
    markAlertRead: (id: string) => Promise<void>
    markAllAlertsRead: () => Promise<void>
    getAlertSettings: () => Promise<AlertSettings>
    updateAlertSettings: (data: Partial<AlertSettings>) => Promise<AlertSettings>

    // Net Worth
    getNetWorthHistory: () => Promise<NetWorthSnapshot[]>
    upsertNetWorth: (data: NetWorthSnapshot) => Promise<void>

    // PDF
    parsePDF: (filePath: string, bankId: string, accountId: string) => Promise<{
      success: boolean
      transactions: ParsedTransaction[]
      count: number
    }>

    // Dialog
    showOpenDialog: () => Promise<string | null>

    // Settings
    getApiKey: () => Promise<string>
    setApiKey: (key: string) => Promise<void>

    // Eventos
    onDataChanged: (callback: (entity: string) => void) => any
    offDataChanged: (handler: any) => void
  }
}
```
