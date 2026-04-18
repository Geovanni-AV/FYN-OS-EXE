---
name: fyn-electron-migration
description: >
  Skill de contexto completo para continuar la migración de Fyn Finance OS de
  Supabase/Express a una app de escritorio Electron + SQLite empaquetada como .exe
  para Windows 64-bit. Usar SIEMPRE que el usuario mencione: Fyn Finance, migración
  a Electron, SQLite local, empaquetar .exe, antigravity + fyn, IPC handlers, PDF
  parsing local, o cualquier tarea de desarrollo sobre este proyecto. También activar
  cuando el usuario diga "continuar con la migración", "siguiente fase" o "retomar
  el proyecto de finanzas".
---

# Fyn Finance OS — Skill de Migración a Electron (.exe Local)

## Contexto del Proyecto

**Fyn Finance OS** es una app fintech personal para el mercado mexicano.
- **Stack frontend:** React 18 + TypeScript strict + Vite + Tailwind CSS v3 + Recharts + React Router v6
- **13 pantallas completas** y funcionales (UI 100% terminada, no modificar estructura)
- **Estado actual:** Frontend conectado a Supabase (cloud) + servidor Express local en puerto 3001
- **Objetivo final:** App `.exe` 100% local para Windows x64 — sin servidores externos, sin Docker, sin configuración adicional

## Herramienta de Desarrollo: Google Antigravity

Google Antigravity es el IDE agéntico de Google (fork de VS Code) donde se ejecuta este trabajo.

### Cómo funciona Antigravity
- Tiene un **Agent Manager** (Mission Control) para orquestar agentes autónomos
- Los agentes pueden ejecutar terminal, editar archivos, abrir el navegador integrado y verificar resultados
- Usa Gemini 3 Pro por defecto, pero también soporta Claude y GPT
- **Siempre generar un "artifact" (plan) antes de ejecutar** — el usuario debe aprobar antes de que el agente actúe
- En Windows: usar siempre `pwsh` (PowerShell Core), nunca bash/bash-style

### Configuración recomendada en Antigravity para este proyecto
```
Terminal policy: Request Review (nunca "Always Proceed")
Custom instructions: "Always use PowerShell Core (pwsh). Before any task, generate a plan artifact and wait for approval. Never modify src/types/index.ts, tailwind.config.ts, or src/hooks/useFinance.ts."
```

---

## Reglas No Negociables del Proyecto

Estas reglas vienen del archivo `.agents/rules/fyn-rules.md` y NUNCA se pueden violar:

### Archivos Intocables
- `src/types/index.ts` — fuente de verdad de todos los tipos
- `tailwind.config.ts` — configuración de estilos
- `src/hooks/useFinance.ts` — hooks de cálculo financiero

### Archivos que Solo Reciben Datos (no se restructuran)
- `src/screens/**/*` — las 13 pantallas, solo se conectan datos
- `src/components/ui/index.tsx` — solo se permite agregar `style?: React.CSSProperties` a Card (bug conocido)
- `src/mockData/index.ts` — mantener pero corregir 2 errores de TS (ver sección de bugs)

### Convenciones
- TypeScript strict — sin `any` salvo casos documentados
- `snake_case` en columnas de BD → `camelCase` en TypeScript (siempre via mappers explícitos)
- Nunca guardar `spent` en budgets — siempre calculado dinámicamente

---

## Estado Actual y Bugs Conocidos

### Errores TypeScript pendientes (corregir en Fase 8.1)

**`src/mockData/index.ts`** — líneas con `type: 'freelance'` e `type: 'inversiones'`:
- tx-012, tx-027, tx-028: cambiar `type: 'freelance'` → `type: 'ingreso'` (mantener `category: 'freelance'`)
- tx-030: cambiar `type: 'inversiones'` → `type: 'ingreso'` (mantener `category: 'inversiones'`)

**`src/components/ui/index.tsx`** — interfaz Card:
- Agregar `style?: React.CSSProperties` a las props de Card

---

## Plan de Migración Completo — Estado de Fases

Lee `references/plan-detallado.md` para los pasos específicos de cada fase.

| Fase | Nombre | Estado |
|------|--------|--------|
| 0 | Preparación del entorno en Antigravity | ⬜ Pendiente |
| 1 | Migración BD: Supabase → SQLite | ⬜ Pendiente |
| 2 | Eliminar Supabase Auth → Perfiles locales | ⬜ Pendiente |
| 3 | Integración Electron (Main Process + IPC) | ⬜ Pendiente |
| 4 | Frontend: Supabase API → IPC calls | ⬜ Pendiente |
| 5 | Configuración Vite para Electron | ⬜ Pendiente |
| 6 | Empaquetado electron-builder (.exe NSIS) | ⬜ Pendiente |
| 7 | Pantalla de configuración API Key Claude | ⬜ Pendiente |
| 8 | Pruebas y compilación final | ⬜ Pendiente |
| 9 | Validación en Windows limpio (manual) | ⬜ Pendiente |

---

## Arquitectura Final (objetivo)

```
FynFinanceSetup.exe
└── Electron (Node.js embebido)
    ├── Main Process
    │   ├── electron/main.ts          ← crea ventana, inicializa SQLite
    │   ├── electron/preload.ts       ← bridge seguro contextBridge
    │   └── electron/handlers/
    │       ├── dbHandlers.ts         ← IPC para CRUD SQLite
    │       ├── pdfHandlers.ts        ← parseo PDF (BBVA, Nu, Santander...)
    │       └── settingsHandlers.ts   ← API Key Claude (electron-store)
    ├── SQLite Database
    │   └── %APPDATA%/FynFinance/fyn-finance.sqlite
    └── Renderer Process (React)
        ├── src/context/AppContext.tsx   ← usa window.electronAPI.*
        ├── src/context/LocalAuthContext.tsx  ← reemplaza AuthContext
        ├── src/lib/api/*.ts             ← llaman a IPC, no a Supabase
        ├── src/db/
        │   ├── database.ts             ← init SQLite + schema
        │   ├── schema.ts               ← CREATE TABLE IF NOT EXISTS
        │   ├── queries/                ← getBudgetSpent(), etc.
        │   └── repositories/           ← accounts, transactions, budgets...
        └── src/types/electron.d.ts     ← tipado de window.electronAPI
```

---

## Dependencias a Instalar (resumen)

```bash
# Electron
npm install --save-dev electron electron-builder vite-plugin-electron vite-plugin-electron-renderer

# Base de datos local
npm install better-sqlite3
npm install --save-dev @types/better-sqlite3 @electron/rebuild

# Almacenamiento seguro de configuración
npm install electron-store

# Fuentes offline (reemplaza Google Fonts CDN)
npm install --save-dev vite-plugin-webfont-dl
```

**Remover después de la migración:**
```bash
npm uninstall @supabase/supabase-js
```

---

## Mapeo de Cambios Críticos

### `AppContext.tsx` — Patrón de migración
```typescript
// ANTES (Supabase)
const [accounts, setAccounts] = useState(mockAccounts)

// DESPUÉS (IPC local)
const [accounts, setAccounts] = useState<Account[]>([])
useEffect(() => {
  window.electronAPI.getAccounts()
    .then(data => setAccounts(data.map(mapAccountFromDB)))
}, [profileId])
```

### `Registro/index.tsx` — PDF upload
```typescript
// ANTES (fetch a Express en puerto 3001)
const response = await fetch('http://localhost:3001/api/upload-bank-statement', { ... })

// DESPUÉS (IPC directo)
const filePath = await window.electronAPI.showOpenDialog({ filters: [{ name: 'PDF', extensions: ['pdf'] }] })
const result = await window.electronAPI.parsePDF(filePath, bankId, accountId)
```

### `AuthContext` → `LocalAuthContext`
```typescript
// ANTES — depende de sesión Supabase
const { session, user, loading } = useAuth()

// DESPUÉS — lee perfil de SQLite local
const { profileId, profile, loading } = useLocalAuth()
```

### `RequireAuth` → `RequireLocalProfile` en `App.tsx`
```typescript
function RequireLocalProfile({ children }: { children: JSX.Element }) {
  const { profileId, loading } = useLocalAuth()
  if (loading) return <LoadingSpinner />
  if (!profileId) return <Navigate to="/onboarding" replace />
  return children
}
```

---

## SQLite: Diferencias críticas con PostgreSQL

| PostgreSQL | SQLite equivalente |
|---|---|
| `uuid default uuid_generate_v4()` | `TEXT DEFAULT (lower(hex(randomblob(16))))` |
| `timestamptz` | `TEXT` (ISO 8601: `2026-03-20T10:00:00Z`) |
| `numeric(12,2)` | `REAL` |
| `boolean default true` | `INTEGER DEFAULT 1` |
| `text[]` (arrays de tags) | `TEXT` (JSON: `'["tag1","tag2"]'`) |
| `auth.uid()` en RLS | No aplica — se pasa `userId` explícitamente |
| `get_budget_spent()` función SQL | Función TypeScript en `src/db/queries/budgets.ts` |
| Trigger `budget_threshold_check` | Función llamada después de cada INSERT de gasto |

---

## Prompt Base para Antigravity (usar al inicio de cada sesión)

Copiar y pegar esto en el Agent Manager de Antigravity al iniciar una nueva sesión de trabajo:

```
Eres el agente principal del proyecto Fyn Finance OS v2.0.
Tu misión es migrar esta app React+Supabase a una app Electron de escritorio
empaquetada como .exe para Windows x64.

REGLAS ABSOLUTAS:
1. NUNCA modifiques: src/types/index.ts, tailwind.config.ts, src/hooks/useFinance.ts
2. NUNCA restructures los componentes de pantallas en src/screens/
3. SIEMPRE genera un artifact con el plan detallado ANTES de ejecutar cualquier código
4. SIEMPRE usa PowerShell Core (pwsh) para comandos de terminal
5. Los errores de TypeScript se solucionan en la raíz, nunca con "as any"

CONTEXTO TÉCNICO:
- Stack: React 18 + TypeScript strict + Vite + Tailwind v3
- BD objetivo: better-sqlite3 (reemplaza Supabase PostgreSQL)
- Desktop: Electron (main process + preload + IPC handlers)
- Empaquetado: electron-builder con target NSIS para Windows x64
- Fuentes: offline (sin CDN de Google Fonts)
- Auth: perfiles locales en SQLite (sin Supabase Auth/GoTrue)

La skill de contexto completo está en .agents/skills/fyn-electron-migration/SKILL.md
```

---

## Referencia de Archivos

- `references/plan-detallado.md` — Instrucciones paso a paso para cada fase (1-9)
- `references/schema-sqlite.md` — Schema SQLite completo traducido desde PostgreSQL
- `references/ipc-api.md` — Contrato completo de la API IPC (todos los canales)
- `references/parsers.md` — Referencia de parsers PDF bancarios (se reutiliza sin cambios)
