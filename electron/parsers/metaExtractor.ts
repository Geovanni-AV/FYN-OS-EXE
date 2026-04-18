export interface AccountMeta {
  accountNumber: string | null
  clabe:         string | null
  lastFour:      string | null
  holderName:    string | null
  accountName:   string        
  accountType:   'debito' | 'credito' | 'inversion' | 'efectivo'
  currency:      string
  finalBalance:  number | undefined
}

export function extractAccountMeta(text: string, bankId: string): AccountMeta {
  const defaults: AccountMeta = {
    accountNumber: null,
    clabe: null,
    lastFour: null,
    holderName: null,
    accountName: `${bankId} Cuenta`,
    accountType: 'debito',
    currency: 'MXN',
    finalBalance: undefined,
  }

  switch (bankId) {
    case 'Openbank': return extractOpenbankMeta(text, defaults)
    case 'BBVA':     return extractBBVAMeta(text, defaults)
    case 'Nu':       return extractNuMeta(text, defaults)
    default:         return defaults
  }
}

function extractOpenbankMeta(text: string, base: AccountMeta): AccountMeta {
  const numMatch = text.match(/N[úu]mero de cuenta\s+(\d{7,12})/i)
  const clabeMatch = text.match(/Cuenta Clabe\s+(\d{18})/i)
  const isApartado = /Apartado Open/i.test(text)
  
  const balances = [...text.matchAll(/Saldo final\s+\$\s*([\d,]+\.\d{2})/g)]
  const finalBalance = balances.length >= 2
    ? parseFloat(balances[1][1].replace(/,/g, '')) 
    : balances[0]
      ? parseFloat(balances[0][1].replace(/,/g, ''))
      : undefined

  const accountNum = numMatch?.[1] ?? null
  const lastFour = accountNum ? accountNum.slice(-4) : clabeMatch?.[1].slice(-4) ?? null

  return {
    ...base,
    accountNumber: accountNum,
    clabe: clabeMatch?.[1] ?? null,
    lastFour,
    accountName: isApartado ? 'Openbank Apartado' : `Openbank Débito ${lastFour || ''}`.trim(),
    accountType: isApartado ? 'inversion' : 'debito',
    finalBalance,
  }
}

function extractBBVAMeta(text: string, base: AccountMeta): AccountMeta {
  const clabeMatch = text.match(/CLABE[:\s]+(\d{18})/i)
  const balanceMatch = text.match(/Saldo\s+(?:final|actual)[:\s]+\$?\s*([\d,]+\.\d{2})/i)
  const lastFour = clabeMatch?.[1].slice(-4) ?? null

  return {
    ...base,
    clabe: clabeMatch?.[1] ?? null,
    lastFour,
    accountName: `BBVA ••${lastFour || 'Nómina'}`,
    finalBalance: balanceMatch ? parseFloat(balanceMatch[1].replace(/,/g, '')) : undefined,
  }
}

function extractNuMeta(text: string, base: AccountMeta): AccountMeta {
  const balanceMatch = text.match(/Saldo\s+final[:\s]+\$?\s*([\d,]+\.\d{2})/i)
  return {
    ...base,
    accountName: 'Nu Cuenta',
    finalBalance: balanceMatch ? parseFloat(balanceMatch[1].replace(/,/g, '')) : undefined,
  }
}
