import { describe, it, expect } from 'vitest'
import { computeSettlements } from './settlement'
import type { Person, Expense } from './settlement'

const alice: Person = { id: 'alice', name: 'Alice' }
const bob: Person = { id: 'bob', name: 'Bob' }
const carol: Person = { id: 'carol', name: 'Carol' }
const dan: Person = { id: 'dan', name: 'Dan' }

function makeExpense(overrides: Partial<Expense> & Pick<Expense, 'payer' | 'amountCents' | 'participants'>): Expense {
  return { id: crypto.randomUUID(), description: '', ...overrides }
}

describe('computeSettlements', () => {
  it('even split with no remainder', () => {
    // Alice pays $30, split evenly across Alice + Bob + Carol ($10 each)
    const expense = makeExpense({ payer: 'alice', amountCents: 3000, participants: ['alice', 'bob', 'carol'] })
    const { balances, settlements } = computeSettlements([alice, bob, carol], [expense])

    expect(balances.find(b => b.personId === 'alice')?.amountCents).toBe(2000)  // paid 3000, owes 1000
    expect(balances.find(b => b.personId === 'bob')?.amountCents).toBe(-1000)
    expect(balances.find(b => b.personId === 'carol')?.amountCents).toBe(-1000)

    const sum = balances.reduce((acc, b) => acc + b.amountCents, 0)
    expect(sum).toBe(0)

    expect(settlements).toHaveLength(2)
    settlements.forEach(s => expect(s.amountCents).toBe(1000))
  })

  it('1000 cents across 3 people: splits sum to total and balances sum to zero', () => {
    // 1000 / 3 → 334 + 333 + 333
    const expense = makeExpense({ payer: 'alice', amountCents: 1000, participants: ['alice', 'bob', 'carol'] })
    const { balances } = computeSettlements([alice, bob, carol], [expense])

    // alice paid 1000, owes 334 → net +666
    // bob owes 333 → net -333
    // carol owes 333 → net -333
    expect(balances.find(b => b.personId === 'alice')?.amountCents).toBe(666)
    expect(balances.find(b => b.personId === 'bob')?.amountCents).toBe(-333)
    expect(balances.find(b => b.personId === 'carol')?.amountCents).toBe(-333)

    const sum = balances.reduce((acc, b) => acc + b.amountCents, 0)
    expect(sum).toBe(0)
  })

  it('one person paid for everything', () => {
    const e1 = makeExpense({ payer: 'alice', amountCents: 6000, participants: ['alice', 'bob', 'carol'] })
    const e2 = makeExpense({ payer: 'alice', amountCents: 3000, participants: ['alice', 'bob', 'carol'] })
    const { balances, settlements } = computeSettlements([alice, bob, carol], [e1, e2])

    const sum = balances.reduce((acc, b) => acc + b.amountCents, 0)
    expect(sum).toBe(0)

    // Alice is owed by both Bob and Carol
    expect(balances.find(b => b.personId === 'alice')?.amountCents).toBeGreaterThan(0)
    settlements.forEach(s => expect(s.to).toBe('alice'))
  })

  it('multiple payers across multiple expenses', () => {
    // Alice pays $60 for all three; Bob pays $30 for all three
    const e1 = makeExpense({ payer: 'alice', amountCents: 6000, participants: ['alice', 'bob', 'carol'] })
    const e2 = makeExpense({ payer: 'bob', amountCents: 3000, participants: ['alice', 'bob', 'carol'] })
    const { balances, settlements } = computeSettlements([alice, bob, carol], [e1, e2])

    const sum = balances.reduce((acc, b) => acc + b.amountCents, 0)
    expect(sum).toBe(0)

    // Carol paid nothing so must appear as a debtor
    expect(balances.find(b => b.personId === 'carol')?.amountCents).toBeLessThan(0)
    expect(settlements.length).toBeGreaterThan(0)
    settlements.forEach(s => expect(s.amountCents).toBeGreaterThan(0))
  })

  it('already-square group produces zero settlement transactions', () => {
    // Each person pays exactly $10 for themselves → no one owes anyone
    const e1 = makeExpense({ payer: 'alice', amountCents: 1000, participants: ['alice'] })
    const e2 = makeExpense({ payer: 'bob', amountCents: 1000, participants: ['bob'] })
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
    // Alice pays $20 split evenly → Bob owes Alice $10
    const expense = makeExpense({ payer: 'alice', amountCents: 2000, participants: ['alice', 'bob'] })
    const { settlements } = computeSettlements([alice, bob], [expense])

    expect(settlements).toHaveLength(1)
    expect(settlements[0].from).toBe('bob')
    expect(settlements[0].to).toBe('alice')
    expect(settlements[0].amountCents).toBe(1000)
  })

  it('single debtor pays two different creditors in correct order', () => {
    // Alice paid $60 for [alice, bob] → alice owed $30, bob owes $30
    // Carol paid $40 for [bob, carol]  → carol owed $20, bob owes $20
    // Net: alice +3000, carol +2000, bob -5000
    // Greedy: bob pays alice first (larger creditor), then carol
    const e1 = makeExpense({ payer: 'alice', amountCents: 6000, participants: ['alice', 'bob'] })
    const e2 = makeExpense({ payer: 'carol', amountCents: 4000, participants: ['bob', 'carol'] })
    const { balances, settlements } = computeSettlements([alice, bob, carol], [e1, e2])

    const sum = balances.reduce((acc, b) => acc + b.amountCents, 0)
    expect(sum).toBe(0)

    expect(settlements).toHaveLength(2)
    expect(settlements[0]).toEqual({ from: 'bob', to: 'alice', amountCents: 3000 })
    expect(settlements[1]).toEqual({ from: 'bob', to: 'carol', amountCents: 2000 })
  })

  it('greedy produces at most n-1 settlements (4-person group → 3 settlements)', () => {
    // Alice pays $12 (1200¢) for all four; each owes $3 (300¢)
    // Net: alice +900, bob -300, carol -300, dan -300
    const expense = makeExpense({ payer: 'alice', amountCents: 1200, participants: ['alice', 'bob', 'carol', 'dan'] })
    const { balances, settlements } = computeSettlements([alice, bob, carol, dan], [expense])

    const sum = balances.reduce((acc, b) => acc + b.amountCents, 0)
    expect(sum).toBe(0)

    expect(settlements).toHaveLength(3) // n-1 for n=4
    settlements.forEach(s => {
      expect(s.to).toBe('alice')
      expect(s.amountCents).toBe(300)
    })
    const froms = settlements.map(s => s.from).sort()
    expect(froms).toEqual(['bob', 'carol', 'dan'].sort())
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
})
