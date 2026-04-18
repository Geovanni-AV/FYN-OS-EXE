# Schema SQLite — Fyn Finance OS

Schema completo traducido desde `supabase/migrations/001_initial_schema.sql`.
Usar este archivo como referencia exacta al crear `src/db/schema.ts`.

## Diferencias clave con PostgreSQL

- Los UUIDs se generan con `lower(hex(randomblob(16)))` en SQLite
- `TIMESTAMPTZ` → `TEXT` en formato ISO 8601
- `NUMERIC(12,2)` → `REAL`
- `BOOLEAN` → `INTEGER` (0/1)
- `TEXT[]` (arrays) → `TEXT` con JSON serializado
- Sin RLS — la seguridad es por `user_id` pasado explícitamente
- Sin `auth.users` — la tabla `profiles` es independiente

---

## Schema Completo

```sql
-- PROFILES (sin referencia a auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  currency TEXT DEFAULT 'MXN',
  theme TEXT DEFAULT 'dark',
  onboarding_done INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ACCOUNTS
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bank TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('debito','credito','efectivo','inversion')),
  balance REAL DEFAULT 0,
  credit_limit REAL,
  currency TEXT DEFAULT 'MXN',
  color TEXT DEFAULT '#2563EB',
  last_four TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  date TEXT NOT NULL,
  amount REAL NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('gasto','ingreso','transferencia')),
  category TEXT NOT NULL,
  description TEXT,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual','ocr','pdf','sync')),
  is_recurring INTEGER DEFAULT 0,
  recurrence_period TEXT,
  tags TEXT DEFAULT '[]',
  notes TEXT,
  dedup_hash TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tx_dedup ON transactions(user_id, dedup_hash) WHERE dedup_hash IS NOT NULL;

-- BUDGETS (sin columna 'spent' — se calcula dinámicamente)
CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  monthly_limit REAL NOT NULL,
  period TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, category, period)
);

-- SAVING GOALS
CREATE TABLE IF NOT EXISTS saving_goals (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  target_amount REAL NOT NULL,
  current_amount REAL DEFAULT 0,
  target_date TEXT,
  monthly_contribution REAL DEFAULT 0,
  expected_return REAL DEFAULT 0.07,
  color TEXT DEFAULT '#2563EB',
  icon TEXT DEFAULT 'savings',
  created_at TEXT DEFAULT (datetime('now'))
);

-- DEBTS
CREATE TABLE IF NOT EXISTS debts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  balance REAL NOT NULL,
  original_balance REAL NOT NULL,
  interest_rate REAL NOT NULL,
  minimum_payment REAL NOT NULL,
  due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ALERTS
CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info','warning','danger','success')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  related_entity_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ALERT SETTINGS
CREATE TABLE IF NOT EXISTS alert_settings (
  user_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  presupuesto_alerta INTEGER DEFAULT 1,
  presupuesto_excedido INTEGER DEFAULT 1,
  pago_proximo INTEGER DEFAULT 1,
  pago_vencido INTEGER DEFAULT 1,
  meta_lograda INTEGER DEFAULT 1,
  saldo_bajo INTEGER DEFAULT 1,
  gasto_inusual INTEGER DEFAULT 0,
  racha_ahorro INTEGER DEFAULT 1,
  resumen_semanal INTEGER DEFAULT 0
);

-- NET WORTH HISTORY
CREATE TABLE IF NOT EXISTS net_worth_history (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  assets REAL NOT NULL,
  liabilities REAL NOT NULL,
  net_worth REAL NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, month)
);

-- PDF UPLOADS (log de importaciones)
CREATE TABLE IF NOT EXISTS pdf_uploads (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  bank TEXT NOT NULL,
  status TEXT DEFAULT 'done' CHECK (status IN ('pending','processing','done','error')),
  transactions_imported INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- SETTINGS (clave-valor para persistir preferencias)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

## Implementación en `src/db/schema.ts`

```typescript
import type Database from 'better-sqlite3'

export function runMigrations(db: Database.Database): void {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    
    -- [pegar aquí el schema completo de arriba]
  `)
}
```

## Notas sobre mappers

Al leer datos de SQLite, convertir:
- `INTEGER` (0/1) → `boolean` en TypeScript
- `TEXT` tags → `JSON.parse(tags) as string[]`
- Todos los `snake_case` → `camelCase`

Al escribir en SQLite, convertir:
- `boolean` → `1` o `0`
- `string[]` → `JSON.stringify(tags)`
