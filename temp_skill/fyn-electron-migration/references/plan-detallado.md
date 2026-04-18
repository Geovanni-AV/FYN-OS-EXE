# Plan Detallado de Migración — Fyn Finance OS → Electron .exe

## Cómo usar este archivo

Este archivo contiene las instrucciones específicas para cada fase del plan de migración.
Al comenzar una fase, leer la sección correspondiente y generar un artifact en Antigravity
antes de ejecutar cualquier comando.

---

## FASE 0 — Preparación del Entorno en Antigravity

### Configuración del Agent Manager
1. Abrir Antigravity y crear workspace apuntando a la carpeta raíz de `fyn-finance-os/`
2. Terminal policy → **Request Review**
3. Deny List: agregar `rm -rf`, `format`, `del /f`, `Remove-Item -Recurse -Force C:\`
4. Allow List: agregar `pwsh`, `npm`, `npx`, `tsc`, `node`
5. Agregar instrucciones personalizadas (ver prompt base en SKILL.md)

### Verificación inicial
```powershell
# Verificar que el proyecto existe y compila
pwsh -c "cd fyn-finance-os; npm run build 2>&1 | tail -20"
```

**Checkpoint:** Build debe fallar solo por los 2 errores TypeScript conocidos, no por nada más.

---

## FASE 1 — Migración de Base de Datos: Supabase → SQLite

### Prompt para Antigravity
> "Ejecuta la Fase 1 del plan de migración: reemplazar Supabase PostgreSQL por better-sqlite3.
> Lee la skill en `.agents/skills/fyn-electron-migration/SKILL.md` primero.
> Genera un artifact con la lista de archivos a crear/modificar y espera aprobación."

### Paso 1.1 — Instalar dependencias
```powershell
pwsh -c "npm install better-sqlite3"
pwsh -c "npm install --save-dev @types/better-sqlite3"
```

### Paso 1.2 — Crear `src/db/database.ts`
```typescript
import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { runMigrations } from './schema'

let db: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (!db) throw new Error('Database not initialized. Call initializeDatabase() first.')
  return db
}

export function initializeDatabase(dbPath?: string): Database.Database {
  const resolvedPath = dbPath ?? join(
    process.env.NODE_ENV === 'development'
      ? './dev-data'
      : app.getPath('userData'),
    'fyn-finance.sqlite'
  )
  db = new Database(resolvedPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  runMigrations(db)
  return db
}
```

### Paso 1.3 — Crear `src/db/schema.ts`

Ver `references/schema-sqlite.md` para el schema completo.
El agente debe traducir `supabase/migrations/001_initial_schema.sql` con las equivalencias
documentadas en SKILL.md (uuid, timestamptz, numeric, boolean, arrays).

### Paso 1.4 — Crear `src/db/queries/budgets.ts`
```typescript
import type Database from 'better-sqlite3'

export function getBudgetSpent(
  db: Database.Database,
  userId: string,
  category: string,
  period: string
): number {
  const result = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM transactions
    WHERE user_id = ?
      AND category = ?
      AND strftime('%Y-%m', date) = ?
      AND type = 'gasto'
  `).get(userId, category, period) as { total: number }
  return result.total
}
```

### Paso 1.5 — Crear `src/db/triggers/budgetAlert.ts`
Lógica que reemplaza el trigger PostgreSQL. Se llama desde `dbHandlers.ts`
después de cada INSERT de transacción tipo 'gasto':
```typescript
export function checkAndCreateBudgetAlert(
  db: Database.Database,
  userId: string,
  category: string
): void {
  const period = new Date().toISOString().slice(0, 7) // YYYY-MM
  const spent = getBudgetSpent(db, userId, category, period)
  const budget = db.prepare(
    'SELECT monthly_limit FROM budgets WHERE user_id=? AND category=? AND period=?'
  ).get(userId, category, period) as { monthly_limit: number } | undefined
  
  if (!budget) return
  const pct = spent / budget.monthly_limit
  if (pct < 0.8) return
  
  const type = pct >= 1 ? 'presupuesto_excedido' : 'presupuesto_alerta'
  const severity = pct >= 1 ? 'danger' : 'warning'
  const title = pct >= 1 ? 'Presupuesto excedido' : 'Presupuesto al 80%'
  const message = `Categoría ${category}: $${spent.toFixed(2)} de $${budget.monthly_limit.toFixed(2)}`
  
  db.prepare(`
    INSERT OR IGNORE INTO alerts (id, user_id, type, severity, title, message, is_read, created_at)
    VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, 0, datetime('now'))
  `).run(userId, type, severity, title, message)
}
```

### Paso 1.6 — Crear `src/db/repositories/`

Un archivo por entidad. Cada uno exporta funciones CRUD que:
- Reciben `db: Database.Database` y parámetros explícitos
- Usan mappers para convertir `snake_case` → `camelCase`
- Retornan tipos de `src/types/index.ts`

Archivos a crear:
- `accounts.ts` — getAll, getById, create, update, softDelete
- `transactions.ts` — getAll, getByAccount, create, delete, deduplicateHash
- `budgets.ts` — getAll, upsert, getWithSpent (usa getBudgetSpent)
- `goals.ts` — getAll, create, update
- `debts.ts` — getAll, create, update
- `alerts.ts` — getAll, markRead, markAllRead, create
- `netWorth.ts` — getHistory, upsertSnapshot
- `profiles.ts` — get, create, update

### Paso 1.7 — Función de deduplicación
Reutilizar la lógica de `server/lib/deduplicator.ts`:
```typescript
// src/db/utils/deduplicator.ts
export function txHash(date: string, amount: number, description: string): string {
  return `${date}|${amount}|${description.toLowerCase().trim()}`
}
```

**Checkpoint Fase 1:** `tsc --noEmit` debe pasar (salvo los 2 errores conocidos en mockData).

---

## FASE 2 — Eliminar Supabase Auth → Perfiles Locales

### Prompt para Antigravity
> "Ejecuta la Fase 2: reemplazar Supabase Auth con un sistema de perfiles locales en SQLite.
> No modificar src/types/index.ts. Generar artifact primero."

### Paso 2.1 — Crear `src/context/LocalAuthContext.tsx`
```typescript
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { UserProfile } from '../types'

interface LocalAuthContextType {
  profileId: string | null
  profile: UserProfile | null
  loading: boolean
  createProfile: (name: string, email?: string) => Promise<void>
  signOut: () => void
}

const LocalAuthContext = createContext<LocalAuthContextType | undefined>(undefined)

export function LocalAuthProvider({ children }: { children: ReactNode }) {
  const [profileId, setProfileId] = useState<string | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.electronAPI.getProfile()
      .then((p) => {
        if (p) {
          setProfileId(p.id)
          setProfile(p)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const createProfile = async (name: string, email = '') => {
    const p = await window.electronAPI.createProfile({ name, email })
    setProfileId(p.id)
    setProfile(p)
  }

  const signOut = () => {
    setProfileId(null)
    setProfile(null)
  }

  return (
    <LocalAuthContext.Provider value={{ profileId, profile, loading, createProfile, signOut }}>
      {children}
    </LocalAuthContext.Provider>
  )
}

export function useLocalAuth() {
  const ctx = useContext(LocalAuthContext)
  if (!ctx) throw new Error('useLocalAuth must be used within LocalAuthProvider')
  return ctx
}
```

### Paso 2.2 — Actualizar `src/App.tsx`
- Reemplazar `<AuthProvider>` por `<LocalAuthProvider>`
- Reemplazar `RequireAuth` por `RequireLocalProfile`
- Eliminar import de `AuthContext` y `supabase`
- El guard lee `profileId` de `useLocalAuth()` en vez de `session` de Supabase

### Paso 2.3 — Eliminar archivos de Supabase frontend
- Eliminar `src/context/AuthContext.tsx`
- Eliminar `src/lib/supabase.ts`
- Eliminar `.env.local` (o vaciar las vars `VITE_SUPABASE_*`)
- En `package.json`: `npm uninstall @supabase/supabase-js`

### Paso 2.4 — Actualizar `src/screens/Onboarding/index.tsx`
El onboarding actualmente llama a `localStorage.setItem('fyn-onboarding-done', '1')`.
Reemplazar por `window.electronAPI.createProfile({ name })` que persiste en SQLite.

**Checkpoint Fase 2:** App carga sin errores de Supabase. Onboarding crea perfil en SQLite.

---

## FASE 3 — Integración Electron (Main Process + IPC)

### Prompt para Antigravity
> "Ejecuta la Fase 3: crear el main process de Electron, preload script, e IPC handlers.
> El servidor Express en /server/ será eliminado al terminar esta fase. Generar artifact primero."

### Paso 3.1 — Instalar dependencias Electron
```powershell
pwsh -c "npm install --save-dev electron electron-builder vite-plugin-electron vite-plugin-electron-renderer"
pwsh -c "npm install electron-store"
pwsh -c "npm install --save-dev @electron/rebuild"
pwsh -c "npx electron-rebuild -f -w better-sqlite3"
```

### Paso 3.2 — Crear `electron/main.ts`
Ver SKILL.md → sección "FASE 3 → Paso 3.2" para el código completo.

Puntos críticos:
- En dev: `win.loadURL('http://localhost:5173')`
- En prod: `win.loadFile(join(__dirname, '../dist/index.html'))`
- `webPreferences.contextIsolation = true` (obligatorio por seguridad)
- `webPreferences.nodeIntegration = false` (obligatorio)
- `webPreferences.preload = join(__dirname, 'preload.js')`

### Paso 3.3 — Crear `electron/preload.ts`
Expone `window.electronAPI` con todos los métodos via `contextBridge.exposeInMainWorld`.
Ver `references/ipc-api.md` para la lista completa de métodos.

### Paso 3.4 — Crear `electron/handlers/dbHandlers.ts`
Registra todos los `ipcMain.handle('db:*', ...)`.
Cada handler:
1. Recibe los argumentos del renderer
2. Obtiene `db` via `getDatabase()`
3. Llama al repositorio correspondiente
4. Retorna el resultado (ya mapeado a camelCase)

### Paso 3.5 — Crear `electron/handlers/pdfHandlers.ts`
Migra la lógica de `server/lib/pdf-processor.ts` al main process.
Los parsers en `server/parsers/` (bbva.ts, nu.ts, santander.ts, etc.) se COPIAN a
`electron/parsers/` sin cambios. El fallback de Claude API se mantiene pero
lee la API key de `electron-store`.

Handler principal:
```typescript
ipcMain.handle('pdf:parse', async (_, filePath: string, bankId: string, accountId: string) => {
  const db = getDatabase()
  return await processPdfLocal(db, filePath, bankId, accountId)
})

ipcMain.handle('dialog:openFile', async () => {
  const { dialog } = require('electron')
  const result = await dialog.showOpenDialog({ 
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
    properties: ['openFile']
  })
  return result.filePaths[0] ?? null
})
```

### Paso 3.6 — Crear `electron/handlers/settingsHandlers.ts`
```typescript
import Store from 'electron-store'
const store = new Store<{ claudeApiKey: string; activeProfileId: string }>()

ipcMain.handle('settings:getApiKey', () => store.get('claudeApiKey', ''))
ipcMain.handle('settings:setApiKey', (_, key: string) => store.set('claudeApiKey', key))
ipcMain.handle('settings:getActiveProfile', () => store.get('activeProfileId', ''))
ipcMain.handle('settings:setActiveProfile', (_, id: string) => store.set('activeProfileId', id))
```

### Paso 3.7 — Crear `src/types/electron.d.ts`
Archivo de declaración de tipos para `window.electronAPI`.
NO modifica `src/types/index.ts`.
Ver `references/ipc-api.md` para la lista completa de métodos a tipar.

**Checkpoint Fase 3:** `npm run dev` abre una ventana Electron cargando la app.

---

## FASE 4 — Frontend: Supabase API → IPC Calls

### Prompt para Antigravity
> "Ejecuta la Fase 4: reescribir src/lib/api/ para usar window.electronAPI.
> No modificar src/types/index.ts ni los screens. Generar artifact primero."

### Paso 4.1 — Reescribir `src/lib/api/accounts.ts`
```typescript
import type { Account } from '../../types'
import { mapAccountFromDB } from '../mappers/accounts'

export async function getAccounts(): Promise<Account[]> {
  const rows = await window.electronAPI.getAccounts()
  return rows.map(mapAccountFromDB)
}

export async function createAccount(data: Omit<Account, 'id'>): Promise<Account> {
  const row = await window.electronAPI.createAccount(data)
  return mapAccountFromDB(row)
}

export async function updateAccount(id: string, updates: Partial<Account>): Promise<Account> {
  const row = await window.electronAPI.updateAccount(id, updates)
  return mapAccountFromDB(row)
}
```

Misma lógica para: `transactions.ts`, `budgets.ts`, `goals.ts`, `debts.ts`, `alerts.ts`.

### Paso 4.2 — Crear `src/lib/mappers/`
Extraer los mappers `snake_case → camelCase` de los repositorios al frontend:
- `accounts.ts` → `mapAccountFromDB(row): Account`
- `transactions.ts` → `mapTransactionFromDB(row): Transaction`
- `budgets.ts` → `mapBudgetFromDB(row): Budget`
- etc.

### Paso 4.3 — Actualizar `src/context/AppContext.tsx`
Reemplazar `useState(mockData)` por `useEffect` + llamadas a `src/lib/api/*.ts`.
El perfil se obtiene de `useLocalAuth().profileId`.

Patrón para cada entidad:
```typescript
const [accounts, setAccounts] = useState<Account[]>([])
const [loading, setLoading] = useState(true)
const { profileId } = useLocalAuth()

useEffect(() => {
  if (!profileId) return
  getAccounts().then(setAccounts).finally(() => setLoading(false))
}, [profileId])
```

### Paso 4.4 — Actualizar `src/screens/Registro/index.tsx`

Solo la parte del tab PDF (los otros tabs no cambian):
```typescript
// Reemplazar fetch a localhost:3001 por:
const handleFileSelect = async () => {
  const filePath = await window.electronAPI.showOpenDialog()
  if (!filePath) return
  setIsUploading(true)
  try {
    const result = await window.electronAPI.parsePDF(filePath, detectedBank, accountId)
    if (result.success) {
      setParsedTransactions(result.transactions)
      setPdfStep(2)
    }
  } finally {
    setIsUploading(false)
  }
}
```

### Paso 4.5 — Reemplazar suscripciones Realtime

Supabase tenía `supabase.channel()`. Reemplazar por eventos IPC:
```typescript
// En AppContext
useEffect(() => {
  const handler = (_: any, entity: string) => {
    if (entity === 'transactions') getTransactions().then(setTransactions)
    if (entity === 'accounts') getAccounts().then(setAccounts)
    if (entity === 'budgets') getBudgets().then(setBudgets)
  }
  window.electronAPI.onDataChanged(handler)
  return () => window.electronAPI.offDataChanged(handler)
}, [profileId])
```

El main process emite después de cada escritura:
```typescript
win.webContents.send('data:changed', 'transactions')
```

**Checkpoint Fase 4:** La app carga datos reales de SQLite. Registrar una transacción persiste al reiniciar.

---

## FASE 5 — Configuración Vite para Electron

### Paso 5.1 — Actualizar `vite.config.ts`
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        vite: { build: { outDir: 'dist-electron', sourcemap: true } }
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) { options.reload() },
        vite: { build: { outDir: 'dist-electron', sourcemap: true } }
      }
    ]),
    renderer(),
  ],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: { manualChunks: undefined }
    }
  }
})
```

### Paso 5.2 — Fuentes offline

Opción A (más simple): instalar `vite-plugin-webfont-dl` y configurarlo para Inter + Material Symbols.

Opción B (más robusta): descargar las fuentes a `public/fonts/` y actualizar `src/index.css`:
```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-variable.woff2') format('woff2-variations');
  font-weight: 100 900;
}
```

**Importante:** Material Symbols también se carga de Google CDN en `index.html`. Debe hacerse offline igual.

---

## FASE 6 — Empaquetado electron-builder

### Paso 6.1 — Agregar config de build a `package.json`
```json
{
  "main": "dist-electron/main.js",
  "scripts": {
    "build:electron": "npm run build && electron-builder --win --x64",
    "postinstall": "electron-rebuild -f -w better-sqlite3"
  },
  "build": {
    "appId": "com.fynfinance.os",
    "productName": "Fyn Finance OS",
    "directories": { "output": "release" },
    "files": ["dist/**/*", "dist-electron/**/*", "assets/**/*"],
    "win": {
      "target": [{ "target": "nsis", "arch": ["x64"] }],
      "icon": "assets/icon.ico"
    },
    "nsis": {
      "oneClick": true,
      "perMachine": false,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "shortcutName": "Fyn Finance OS"
    },
    "extraResources": [
      {
        "from": "node_modules/better-sqlite3/build/Release/",
        "to": "native/",
        "filter": ["*.node"]
      }
    ]
  }
}
```

### Paso 6.2 — Crear assets del instalador
- `assets/icon.ico` — ícono multi-tamaño (256, 128, 64, 32, 16 px)
- `assets/icon.png` — PNG 512x512 para referencias internas

El agente puede generar un ícono placeholder (fondo azul #0058bc con "FF" en blanco) si no hay diseño final.

### Paso 6.3 — Recompilar módulos nativos
```powershell
pwsh -c "npx electron-rebuild -f -w better-sqlite3"
```
Este paso es CRÍTICO. `better-sqlite3` incluye código nativo (C++) que debe
compilarse contra la versión exacta de Node que usa Electron.

### Paso 6.4 — Compilar
```powershell
pwsh -c "npm run build:electron"
```
Output esperado: `release/Fyn Finance OS Setup 1.0.0.exe` (~120-150 MB)

---

## FASE 7 — Pantalla de Configuración API Key Claude

### Paso 7.1 — Agregar sección en `src/screens/Perfil/index.tsx`

Agregar un bloque nuevo (sin modificar el existente) para la API Key:
```tsx
// Sección nueva al final del componente
<div className="depth-1 p-10 rounded-[3rem] space-y-8">
  <h3 className="text-xl font-bold">IA Fallback — Claude API</h3>
  <p className="text-sm opacity-60">
    Opcional. Se usa cuando el parser PDF no alcanza 80% de confianza.
  </p>
  <div className="flex gap-4">
    <input
      type="password"
      placeholder="sk-ant-..."
      value={apiKey}
      onChange={e => setApiKey(e.target.value)}
      className="flex-1 depth-1 rounded-2xl px-4 py-3 text-sm"
    />
    <Button onClick={() => window.electronAPI.setApiKey(apiKey)}>
      Guardar
    </Button>
  </div>
</div>
```

---

## FASE 8 — Pruebas y Compilación Final

### Paso 8.1 — Corregir errores TypeScript
```typescript
// src/mockData/index.ts — cambiar estas líneas:
// tx-012: type: 'freelance' → type: 'ingreso'
// tx-027: type: 'freelance' → type: 'ingreso'  
// tx-028: type: 'freelance' → type: 'ingreso'
// tx-030: type: 'inversiones' → type: 'ingreso'

// src/components/ui/index.tsx — agregar a Card props:
// style?: React.CSSProperties
```

### Paso 8.2 — Verificación TypeScript
```powershell
pwsh -c "npx tsc --noEmit 2>&1"
# Debe mostrar 0 errores
```

### Paso 8.3 — Prueba en modo desarrollo
```powershell
pwsh -c "npm run dev"
# Debe abrir ventana Electron con la app
```

Checklist de pruebas mínimas en modo dev:
- [ ] Onboarding crea perfil en SQLite
- [ ] Dashboard carga datos
- [ ] Registrar transacción manual persiste al reiniciar
- [ ] Subir PDF de prueba (BBVA o Nu)
- [ ] Presupuestos muestran gastos calculados dinámicamente
- [ ] Alertas se generan automáticamente al superar 80% de presupuesto

### Paso 8.4 — Build de producción
```powershell
pwsh -c "npm run build"
# Verifica: dist/ y dist-electron/ generados sin errores
```

### Paso 8.5 — Compilar instalador
```powershell
pwsh -c "npm run build:electron"
# Output: release/Fyn Finance OS Setup 1.0.0.exe
```

---

## FASE 9 — Validación en Windows Limpio (Manual)

1. Copiar `Fyn Finance OS Setup 1.0.0.exe` a máquina Windows 10/11 x64 limpia
2. Instalar (doble click, acepta permisos de UAC)
3. Ejecutar desde escritorio o menú inicio
4. Verificar checklist:
   - [ ] App abre sin errores
   - [ ] Onboarding funciona
   - [ ] Transacciones persisten entre reinicios
   - [ ] PDF parsing funciona
   - [ ] Sin dependencias externas requeridas

---

## Orden de Eliminación de Archivos Legacy (al finalizar)

Al terminar todas las fases, estos archivos ya no son necesarios:
```
server/                    ← Todo el directorio del servidor Express
src/context/AuthContext.tsx
src/lib/supabase.ts
.env.local                 (o vaciar vars VITE_SUPABASE_*)
supabase/                  (el directorio completo si se desea)
setup-dev.sh
```
