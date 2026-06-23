/** Parse a user-entered dollar string into integer cents. */
export function parseCents(dollars: string): number {
  const [intStr = '0', decStr = ''] = dollars.trim().replace(/^\$/, '').split('.')
  const intPart = Math.abs(parseInt(intStr, 10) || 0)
  const decPart = parseInt((decStr + '00').slice(0, 2), 10) || 0
  return intPart * 100 + decPart
}

/** Format integer cents as a dollar string, e.g. 1050 → "$10.50". */
export function formatCents(cents: number): string {
  const abs = Math.abs(cents)
  const dollars = Math.floor(abs / 100)
  const pennies = abs % 100
  const sign = cents < 0 ? '-' : ''
  return `${sign}$${dollars}.${String(pennies).padStart(2, '0')}`
}
