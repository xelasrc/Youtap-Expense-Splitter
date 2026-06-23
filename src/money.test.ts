import { describe, it, expect } from 'vitest'
import { parseCents, formatCents } from './money'

describe('parseCents', () => {
  it('parses whole dollars', () => expect(parseCents('10')).toBe(1000))
  it('parses dollars and cents', () => expect(parseCents('10.50')).toBe(1050))
  it('parses a single decimal digit', () => expect(parseCents('10.5')).toBe(1050))
  it('parses sub-dollar amounts', () => expect(parseCents('0.99')).toBe(99))
  it('parses zero', () => expect(parseCents('0')).toBe(0))
  it('strips a leading dollar sign', () => expect(parseCents('$5.00')).toBe(500))
})

describe('formatCents', () => {
  it('formats a whole dollar amount', () => expect(formatCents(1000)).toBe('$10.00'))
  it('pads pennies to two digits', () => expect(formatCents(99)).toBe('$0.99'))
  it('formats a mixed amount', () => expect(formatCents(1050)).toBe('$10.50'))
  it('formats zero', () => expect(formatCents(0)).toBe('$0.00'))
  it('formats negative cents with a leading minus', () => expect(formatCents(-1050)).toBe('-$10.50'))
})
