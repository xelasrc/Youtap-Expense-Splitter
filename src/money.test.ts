import { describe, it, expect } from 'vitest'
import { parseCents, formatCents } from './money'

describe('parseCents', () => {
  it('parses whole dollars', () => expect(parseCents('10')).toBe(1000))
  it('parses dollars and cents', () => expect(parseCents('10.50')).toBe(1050))
  it('parses a single decimal digit', () => expect(parseCents('10.5')).toBe(1050))
  it('parses sub-dollar amounts', () => expect(parseCents('0.99')).toBe(99))
  it('parses zero', () => expect(parseCents('0')).toBe(0))
  it('strips a leading dollar sign', () => expect(parseCents('$5.00')).toBe(500))
  it('parses 1 cent', () => expect(parseCents('0.01')).toBe(1))
  it('parses a large amount', () => expect(parseCents('999999.99')).toBe(99999999))
  it('handles extra whitespace', () => expect(parseCents('  42.00  ')).toBe(4200))
  it('treats empty string as zero', () => expect(parseCents('')).toBe(0))
  it('treats non-numeric input as zero', () => expect(parseCents('abc')).toBe(0))
  it('ignores digits beyond 2 decimal places', () => expect(parseCents('1.999')).toBe(199))
  it('parses $0.01 with dollar sign', () => expect(parseCents('$0.01')).toBe(1))
  it('parses a round hundred', () => expect(parseCents('100')).toBe(10000))
})

describe('formatCents', () => {
  it('formats a whole dollar amount', () => expect(formatCents(1000)).toBe('$10.00'))
  it('pads pennies to two digits', () => expect(formatCents(99)).toBe('$0.99'))
  it('formats a mixed amount', () => expect(formatCents(1050)).toBe('$10.50'))
  it('formats zero', () => expect(formatCents(0)).toBe('$0.00'))
  it('formats negative cents with a leading minus', () => expect(formatCents(-1050)).toBe('-$10.50'))
  it('formats 1 cent', () => expect(formatCents(1)).toBe('$0.01'))
  it('formats a large amount', () => expect(formatCents(99999999)).toBe('$999999.99'))
  it('formats negative zero as zero', () => expect(formatCents(-0)).toBe('$0.00'))
  it('formats exactly $1.00', () => expect(formatCents(100)).toBe('$1.00'))
  it('round-trips: parse then format returns original string', () => {
    const cases = ['0.00', '1.00', '10.50', '999.99', '0.01']
    cases.forEach(str => expect(formatCents(parseCents(str))).toBe(`$${str}`))
  })
})
