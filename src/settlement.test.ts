import { describe, it, expect } from 'vitest'
import { computeSettlements } from './settlement'
import type { Person, Expense } from './settlement'

const alice: Person = { id: 'alice', name: 'Alice' }
const bob: Person   = { id: 'bob',   name: 'Bob'   }
const carol: Person = { id: 'carol', name: 'Carol' }
const dan: Person   = { id: 'dan',   name: 'Dan'   }

function makeExpense(overrides: Partial<Expense> & Pick<Expense, 'payer' | 'amountCents' | 'participants'>): Expense {
  return { id: crypto.randomUUID(), description: '', ...overrides }
}

function balanceSum(balances: { amountCents: number }[]) {
  return balances.reduce((acc, b) => acc + b.amountCents, 0)
}

// ─── Core correctness ──────────────────────────────────────────────────────

describe('computeSettlements', () => {
  it('even split with no remainder', () => {
    const expense = makeExpense({ payer: 'alice', amountCents: 3000, participants: ['alice', 'bob', 'carol'] })
    const { balances, settlements } = computeSettlements([alice, bob, carol], [expense])

    expect(balances.find(b => b.personId === 'alice')?.amountCents).toBe(2000)
    expect(balances.find(b => b.personId === 'bob')?.amountCents).toBe(-1000)
    expect(balances.find(b => b.personId === 'carol')?.amountCents).toBe(-1000)
    expect(balanceSum(balances)).toBe(0)
    expect(settlements).toHaveLength(2)
    settlements.forEach(s => expect(s.amountCents).toBe(1000))
  })

  it('1000 cents across 3 people: splits sum to total and balances sum to zero', () => {
    const expense = makeExpense({ payer: 'alice', amountCents: 1000, participants: ['alice', 'bob', 'carol'] })
    const { balances } = computeSettlements([alice, bob, carol], [expense])

    expect(balances.find(b => b.personId === 'alice')?.amountCents).toBe(666)
    expect(balances.find(b => b.personId === 'bob')?.amountCents).toBe(-333)
    expect(balances.find(b => b.personId === 'carol')?.amountCents).toBe(-333)
    expect(balanceSum(balances)).toBe(0)
  })

  it('one person paid for everything', () => {
    const e1 = makeExpense({ payer: 'alice', amountCents: 6000, participants: ['alice', 'bob', 'carol'] })
    const e2 = makeExpense({ payer: 'alice', amountCents: 3000, participants: ['alice', 'bob', 'carol'] })
    const { balances, settlements } = computeSettlements([alice, bob, carol], [e1, e2])

    expect(balanceSum(balances)).toBe(0)
    expect(balances.find(b => b.personId === 'alice')?.amountCents).toBeGreaterThan(0)
    settlements.forEach(s => expect(s.to).toBe('alice'))
  })

  it('multiple payers across multiple expenses', () => {
    const e1 = makeExpense({ payer: 'alice', amountCents: 6000, participants: ['alice', 'bob', 'carol'] })
    const e2 = makeExpense({ payer: 'bob',   amountCents: 3000, participants: ['alice', 'bob', 'carol'] })
    const { balances, settlements } = computeSettlements([alice, bob, carol], [e1, e2])

    expect(balanceSum(balances)).toBe(0)
    expect(balances.find(b => b.personId === 'carol')?.amountCents).toBeLessThan(0)
    expect(settlements.length).toBeGreaterThan(0)
    settlements.forEach(s => expect(s.amountCents).toBeGreaterThan(0))
  })

  it('already-square group produces zero settlement transactions', () => {
    const e1 = makeExpense({ payer: 'alice', amountCents: 1000, participants: ['alice'] })
    const e2 = makeExpense({ payer: 'bob',   amountCents: 1000, participants: ['bob']   })
    const e3 = makeExpense({ payer: 'carol', amountCents: 1000, participants: ['carol'] })
    const { balances, settlements } = computeSettlements([alice, bob, carol], [e1, e2, e3])

    balances.forEach(b => expect(b.amountCents).toBe(0))
    expect(settlements).toHaveLength(0)
  })

  it('people with no expenses: all balances zero, no settlements', () => {
    const { balances, settlements } = computeSettlements([alice, bob, carol], [])
    balances.forEach(b => expect(b.amountCents).toBe(0))
    expect(settlements).toHaveLength(0)
  })

  it('two-person case: correct from, to, and amount', () => {
    const expense = makeExpense({ payer: 'alice', amountCents: 2000, participants: ['alice', 'bob'] })
    const { settlements } = computeSettlements([alice, bob], [expense])

    expect(settlements).toHaveLength(1)
    expect(settlements[0].from).toBe('bob')
    expect(settlements[0].to).toBe('alice')
    expect(settlements[0].amountCents).toBe(1000)
  })

  it('single debtor pays two different creditors in correct order', () => {
    const e1 = makeExpense({ payer: 'alice', amountCents: 6000, participants: ['alice', 'bob'] })
    const e2 = makeExpense({ payer: 'carol', amountCents: 4000, participants: ['bob',   'carol'] })
    const { balances, settlements } = computeSettlements([alice, bob, carol], [e1, e2])

    expect(balanceSum(balances)).toBe(0)
    expect(settlements).toHaveLength(2)
    expect(settlements[0]).toEqual({ from: 'bob', to: 'alice', amountCents: 3000 })
    expect(settlements[1]).toEqual({ from: 'bob', to: 'carol', amountCents: 2000 })
  })

  it('greedy produces at most n-1 settlements (4-person group → 3 settlements)', () => {
    const expense = makeExpense({ payer: 'alice', amountCents: 1200, participants: ['alice', 'bob', 'carol', 'dan'] })
    const { balances, settlements } = computeSettlements([alice, bob, carol, dan], [expense])

    expect(balanceSum(balances)).toBe(0)
    expect(settlements).toHaveLength(3)
    settlements.forEach(s => {
      expect(s.to).toBe('alice')
      expect(s.amountCents).toBe(300)
    })
    expect(settlements.map(s => s.from).sort()).toEqual(['bob', 'carol', 'dan'].sort())
  })

  it('empty group does not crash', () => {
    const { balances, settlements } = computeSettlements([], [])
    expect(balances).toHaveLength(0)
    expect(settlements).toHaveLength(0)
  })

  it('single-person group does not crash', () => {
    const expense = makeExpense({ payer: 'alice', amountCents: 500, participants: ['alice'] })
    const { balances, settlements } = computeSettlements([alice], [expense])
    expect(balances.find(b => b.personId === 'alice')?.amountCents).toBe(0)
    expect(settlements).toHaveLength(0)
  })

  // ─── Remainder distribution ──────────────────────────────────────────────

  it('$700 + $50 split 3 ways: everyone owes exactly $250 (remainder rotation)', () => {
    const e1 = makeExpense({ payer: 'alice', amountCents: 70000, participants: ['alice', 'bob', 'carol'] })
    const e2 = makeExpense({ payer: 'alice', amountCents:  5000, participants: ['alice', 'bob', 'carol'] })
    const { balances } = computeSettlements([alice, bob, carol], [e1, e2])

    expect(balances.find(b => b.personId === 'bob')?.amountCents).toBe(-25000)
    expect(balances.find(b => b.personId === 'carol')?.amountCents).toBe(-25000)
    expect(balanceSum(balances)).toBe(0)
  })

  it('three expenses of $10 split 3 ways: each person owes exactly $10', () => {
    const people = [alice, bob, carol]
    const expenses = [
      makeExpense({ payer: 'alice', amountCents: 1000, participants: ['alice', 'bob', 'carol'] }),
      makeExpense({ payer: 'alice', amountCents: 1000, participants: ['alice', 'bob', 'carol'] }),
      makeExpense({ payer: 'alice', amountCents: 1000, participants: ['alice', 'bob', 'carol'] }),
    ]
    const { balances } = computeSettlements(people, expenses)

    expect(balances.find(b => b.personId === 'bob')?.amountCents).toBe(-1000)
    expect(balances.find(b => b.personId === 'carol')?.amountCents).toBe(-1000)
    expect(balanceSum(balances)).toBe(0)
  })

  // ─── Per-expense participants ────────────────────────────────────────────

  it('subset participant: non-participant owes nothing', () => {
    // Alice pays $30 for Alice + Bob only — Carol is not involved
    const expense = makeExpense({ payer: 'alice', amountCents: 3000, participants: ['alice', 'bob'] })
    const { balances, settlements } = computeSettlements([alice, bob, carol], [expense])

    expect(balances.find(b => b.personId === 'carol')?.amountCents).toBe(0)
    expect(settlements.every(s => s.from !== 'carol' && s.to !== 'carol')).toBe(true)
    expect(balanceSum(balances)).toBe(0)
  })

  it('mixed participant expenses: only involved people owe', () => {
    // Dinner: Alice + Bob + Carol. Taxi: Alice + Bob only.
    const dinner = makeExpense({ payer: 'alice', amountCents: 9000, participants: ['alice', 'bob', 'carol'] })
    const taxi   = makeExpense({ payer: 'alice', amountCents: 3000, participants: ['alice', 'bob'] })
    const { balances } = computeSettlements([alice, bob, carol], [dinner, taxi])

    // Carol only participates in dinner ($30 split 3 = $10 share), so owes $10
    expect(balances.find(b => b.personId === 'carol')?.amountCents).toBe(-3000)
    expect(balanceSum(balances)).toBe(0)
  })

  // ─── Ridiculous edge cases ───────────────────────────────────────────────

  it('ridiculous: 1 cent split across 3 people — only one person owes 1 cent', () => {
    const expense = makeExpense({ payer: 'alice', amountCents: 1, participants: ['alice', 'bob', 'carol'] })
    const { balances } = computeSettlements([alice, bob, carol], [expense])

    // Total owed must equal 1 cent, only one non-alice person can owe
    const nonAlice = balances.filter(b => b.personId !== 'alice')
    const totalOwed = nonAlice.reduce((sum, b) => sum + Math.abs(Math.min(b.amountCents, 0)), 0)
    expect(totalOwed).toBeLessThanOrEqual(1)
    expect(balanceSum(balances)).toBe(0)
  })

  it('ridiculous: $0.02 split 3 ways — 2 people owe 1 cent, 1 owes 0', () => {
    const expense = makeExpense({ payer: 'alice', amountCents: 2, participants: ['alice', 'bob', 'carol'] })
    const { balances } = computeSettlements([alice, bob, carol], [expense])

    const debtors = balances.filter(b => b.amountCents < 0)
    const totalDebt = debtors.reduce((sum, b) => sum + Math.abs(b.amountCents), 0)
    expect(totalDebt).toBe(1) // alice's net: paid 2, owns 1 (gets 1 cent back)
    expect(balanceSum(balances)).toBe(0)
  })

  it('ridiculous: $999,999.99 split across 2 people', () => {
    const expense = makeExpense({ payer: 'alice', amountCents: 99999999, participants: ['alice', 'bob'] })
    const { balances, settlements } = computeSettlements([alice, bob], [expense])

    expect(balances.find(b => b.personId === 'bob')?.amountCents).toBe(-49999999) // half, rounded
    expect(settlements).toHaveLength(1)
    expect(settlements[0].amountCents).toBe(49999999)
    expect(balanceSum(balances)).toBe(0)
  })

  it('ridiculous: 100 expenses all paid by alice, all balanced at the end', () => {
    const people = [alice, bob, carol]
    const expenses = Array.from({ length: 100 }, (_, i) =>
      makeExpense({ payer: 'alice', amountCents: (i + 1) * 100, participants: ['alice', 'bob', 'carol'] })
    )
    const { balances } = computeSettlements(people, expenses)

    expect(balanceSum(balances)).toBe(0)
    expect(balances.find(b => b.personId === 'alice')?.amountCents).toBeGreaterThan(0)
    balances.filter(b => b.personId !== 'alice').forEach(b => expect(b.amountCents).toBeLessThan(0))
  })

  it('ridiculous: circular payments — A pays for B, B pays for C, C pays for A', () => {
    const e1 = makeExpense({ payer: 'alice', amountCents: 1000, participants: ['alice', 'bob']   })
    const e2 = makeExpense({ payer: 'bob',   amountCents: 1000, participants: ['bob',   'carol'] })
    const e3 = makeExpense({ payer: 'carol', amountCents: 1000, participants: ['carol', 'alice'] })
    const { balances, settlements } = computeSettlements([alice, bob, carol], [e1, e2, e3])

    // Perfectly circular — everyone paid and owes the same, all square
    balances.forEach(b => expect(b.amountCents).toBe(0))
    expect(settlements).toHaveLength(0)
  })

  it('ridiculous: prime number amount ($97) split across 3 people — balances sum to zero', () => {
    const expense = makeExpense({ payer: 'alice', amountCents: 9700, participants: ['alice', 'bob', 'carol'] })
    const { balances } = computeSettlements([alice, bob, carol], [expense])

    expect(balanceSum(balances)).toBe(0)
  })

  it('ridiculous: 10-person group, one payer — at most 9 settlements', () => {
    const people: Person[] = Array.from({ length: 10 }, (_, i) => ({ id: `p${i}`, name: `Person ${i}` }))
    const expense = makeExpense({
      payer: 'p0',
      amountCents: 10000,
      participants: people.map(p => p.id),
    })
    const { balances, settlements } = computeSettlements(people, [expense])

    expect(balanceSum(balances)).toBe(0)
    expect(settlements.length).toBeLessThanOrEqual(9) // n-1
    settlements.forEach(s => expect(s.to).toBe('p0'))
  })

  it('ridiculous: all 4 people pay different amounts, balances always sum to zero', () => {
    const e1 = makeExpense({ payer: 'alice', amountCents: 7331, participants: ['alice', 'bob', 'carol', 'dan'] })
    const e2 = makeExpense({ payer: 'bob',   amountCents: 2999, participants: ['alice', 'bob', 'carol', 'dan'] })
    const e3 = makeExpense({ payer: 'carol', amountCents: 4500, participants: ['alice', 'bob', 'carol', 'dan'] })
    const e4 = makeExpense({ payer: 'dan',   amountCents: 1001, participants: ['alice', 'bob', 'carol', 'dan'] })
    const { balances } = computeSettlements([alice, bob, carol, dan], [e1, e2, e3, e4])

    expect(balanceSum(balances)).toBe(0)
  })

  it('ridiculous: same expense repeated 50 times — balances sum to zero each time', () => {
    const people = [alice, bob, carol, dan]
    const expenses = Array.from({ length: 50 }, () =>
      makeExpense({ payer: 'alice', amountCents: 333, participants: ['alice', 'bob', 'carol', 'dan'] })
    )
    const { balances } = computeSettlements(people, expenses)
    expect(balanceSum(balances)).toBe(0)
  })
})
