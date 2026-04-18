const CATEGORY_RULES: [RegExp, string][] = [
  [/OXXO|7.?ELEVEN|WALMART|SORIANA|CHEDRAUI|COSTCO/i,  'supermercado'],
  [/UBER\s*EATS|RAPPI|DIDI\s*FOOD|DOMINOS|MCDONALDS/i, 'restaurantes'],
  [/NETFLIX|SPOTIFY|DISNEY|HBO|AMAZON\s*PRIME/i,        'entretenimiento'],
  [/CFE|TELMEX|TOTALPLAY|IZZI|TELCEL|AT&T/i,            'servicios'],
  [/FARMA|FARMACIA|SIMILARES|BENAVIDES/i,               'salud'],
  [/GASOLINA|PEMEX|SHELL|BP/i,                          'transporte'],
  [/UBER(?!\s*EATS)|DIDI(?!\s*FOOD)|CABIFY/i,           'transporte'],
  [/LIVERPOOL|ZARA|H&M|PALACIO/i,                       'ropa'],
  [/donacion|DONAT/i,                                   'otros'],
  [/SPEI recib|nómina|NOMINA|sueldo/i,                  'nomina'],
  [/SPEI envi|transferencia/i,                          'otros'],
]

export function inferCategory(description: string, type: 'gasto' | 'ingreso'): string {
  for (const [pattern, category] of CATEGORY_RULES) {
    if (pattern.test(description)) return category
  }
  return type === 'ingreso' ? 'otros' : 'otros'
}

/**
 * Genera un hash único para deduplicación basado en los datos de la transacción
 */
export function generateTxHash(date: string, amount: number, description: string): string {
  const cleanDesc = description.replace(/\s/g, '').toLowerCase()
  const str = `${date}|${amount}|${cleanDesc}`
  let hash = 0
  for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16)
}
