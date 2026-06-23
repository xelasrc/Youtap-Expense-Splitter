export interface Person {
  id: string
  name: string
}

export interface Expense {
  id: string
  payer: string
  amountCents: number
  description?: string
  participants: string[]
}

export interface Balance {
  personId: string
  amountCents: number // positive = is owed, negative = owes
}

export interface Settlement {
  from: string
  to: string
  amountCents: number
}

export interface SettlementResult {
  balances: Balance[]
  settlements: Settlement[]
}

/**
 * Split amountCents across participants. Remainder cents go to the first
 * participants in order so that splits always sum exactly to amountCents.
 */
function splitCents(amountCents: number, participantIds: string[]): Map<string, number> {
  const n = participantIds.length
  const base = Math.floor(amountCents / n)
  const remainder = amountCents % n
  const shares = new Map<string, number>()
  participantIds.forEach((id, i) => {
    shares.set(id, i < remainder ? base + 1 : base)
  })
  return shares
}

export function computeSettlements(people: Person[], expenses: Expense[]): SettlementResult {
  if (people.length === 0) {
    return { balances: [], settlements: [] }
  }

  // Phase 1 — net balances
  const balanceMap = new Map<string, number>(people.map(p => [p.id, 0]))

  for (const expense of expenses) {
    const participants = expense.participants.length > 0 ? expense.participants : people.map(p => p.id)
    const shares = splitCents(expense.amountCents, participants)

    // Payer is credited the full amount
    balanceMap.set(expense.payer, (balanceMap.get(expense.payer) ?? 0) + expense.amountCents)

    // Each participant is debited their share
    for (const [id, share] of shares) {
      balanceMap.set(id, (balanceMap.get(id) ?? 0) - share)
    }
  }

  const balances: Balance[] = people.map(p => ({
    personId: p.id,
    amountCents: balanceMap.get(p.id) ?? 0,
  }))

  // Phase 2 — greedy settlements
  // Work on mutable copies sorted by magnitude descending
  const debtors = balances
    .filter(b => b.amountCents < 0)
    .map(b => ({ personId: b.personId, amountCents: b.amountCents }))

  const creditors = balances
    .filter(b => b.amountCents > 0)
    .map(b => ({ personId: b.personId, amountCents: b.amountCents }))

  const settlements: Settlement[] = []

  while (debtors.length > 0 && creditors.length > 0) {
    // Sort each iteration: largest debtor (most negative) and largest creditor first
    debtors.sort((a, b) => a.amountCents - b.amountCents)
    creditors.sort((a, b) => b.amountCents - a.amountCents)

    const debtor = debtors[0]
    const creditor = creditors[0]

    const transfer = Math.min(-debtor.amountCents, creditor.amountCents)

    settlements.push({ from: debtor.personId, to: creditor.personId, amountCents: transfer })

    debtor.amountCents += transfer
    creditor.amountCents -= transfer

    if (debtor.amountCents === 0) debtors.shift()
    if (creditor.amountCents === 0) creditors.shift()
  }

  return { balances, settlements }
}
