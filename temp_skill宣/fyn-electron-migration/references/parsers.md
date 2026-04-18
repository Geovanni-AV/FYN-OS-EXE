# Bank PDF Parser Reference

## Parser Strategy (sin cambios respecto al server/)

Los parsers de `server/parsers/` se COPIAN a `electron/parsers/` sin modificaciones.
Solo cambia cómo se integran: en vez de rutas Express, son llamados desde `electron/handlers/pdfHandlers.ts`.

```
PDF binary
  → pdf-parse → raw text
    → detectBank() → bank name
      → specific parser → ParsedTransaction[]
        → confidence score
          if < 0.80 → ai-fallback.ts (Claude API via electron-store key)
        → deduplicator.ts → { toInsert[], duplicates[] }
          → SQLite INSERT (via dbHandlers)
```

## Confidence Scoring

A parsed transaction earns 1 point each for: valid date, valid amount > 0, non-empty description, recognized category hint.
Max score = 4. Confidence = matched_fields / total_expected_fields.
If average confidence across all transactions < 0.80 → trigger AI fallback for the entire batch.

## BBVA Format
- Date: `DD/MM/YYYY` or `DD/MM/YY`
- Columns: DATE | DESCRIPTION | WITHDRAWAL | DEPOSIT | BALANCE
- Regex: `/(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\d,]+\.\d{2})?\s+([\d,]+\.\d{2})?\s+([\d,]+\.\d{2})/`
- Encoding: UTF-8
- Type detection: column 3 (withdrawal) → gasto, column 4 (deposit) → ingreso

## Nu Format
- Date: `YYYY-MM-DD`
- Closest to CSV embedded in PDF
- Regex: `/(\d{4}-\d{2}-\d{2})\s+(.+?)\s+(-?[\d,]+\.\d{2})/`
- Negative amounts → gasto, positive → ingreso

## Santander Format
- Date: `DD-MM-YYYY`
- Table with variable spacing
- Often needs AI fallback due to merged columns
- Regex: `/(\d{2}-\d{2}-\d{4})\s+(.+?)\s+([\d.]+,\d{2})/`
- Decimal separator: comma (European format)

## HSBC Format
- Date: `DD/MM/YY` (2-digit year)
- Legacy fixed-width columns
- Parse by character position: date[0:8], desc[10:45], amount[46:58]

## Klar Format
- Date: `YYYY-MM-DD`
- Cleanest format, closest to JSON
- Amounts always positive; "CARGO" → gasto, "ABONO" → ingreso

## Openbank Format
- Date: `DD/MM/YYYY`
- Semicolon-separated (similar to CSV)
- Split on `;` then map columns

## detectBank() — sin cambios

```typescript
export function detectBank(text: string): BankName {
  if (/BBVA|Bancomer/i.test(text)) return 'BBVA'
  if (/Nu\s|Nubank/i.test(text)) return 'Nu'
  if (/Santander/i.test(text)) return 'Santander'
  if (/HSBC/i.test(text)) return 'HSBC'
  if (/Klar/i.test(text)) return 'Klar'
  if (/Openbank/i.test(text)) return 'Openbank'
  return 'Otra'
}
```

## AI Fallback (Claude API) — adaptación para Electron

En vez de leer `process.env.ANTHROPIC_API_KEY` del `.env`, leer de `electron-store`:

```typescript
import Store from 'electron-store'
const store = new Store<{ claudeApiKey: string }>()

async function callClaudeFallback(text: string): Promise<ParsedTransaction[]> {
  const apiKey = store.get('claudeApiKey', '')
  if (!apiKey) {
    console.warn('No Claude API key configured. Skipping AI fallback.')
    return []
  }
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Extract all financial transactions from this Mexican bank statement text.
Return ONLY valid JSON array, no markdown, no explanation:
[{"date":"YYYY-MM-DD","amount":number,"type":"gasto|ingreso","description":"string"}]
Rules: amounts are always positive numbers, type indicates direction.

Text:
${text.slice(0, 4000)}`
      }]
    })
  })
  
  const data = await response.json()
  const raw = data.content?.[0]?.text ?? ''
  
  try {
    return JSON.parse(raw)
  } catch {
    console.error('Claude fallback returned invalid JSON')
    return []
  }
}
```

## Deduplication hash — sin cambios

```typescript
export function txHash(date: string, amount: number, description: string): string {
  return `${date}|${amount}|${description.toLowerCase().trim()}`
}
```
