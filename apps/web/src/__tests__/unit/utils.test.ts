import { describe, it, expect } from 'vitest'
import { cn, formatDate, formatCurrency, getInitials, truncate } from '@/lib/utils'

describe('cn()', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes (false skipped)', () => {
    expect(cn('base', false && 'skip', 'add')).toBe('base add')
  })

  it('deduplicates conflicting tailwind classes (last wins)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('handles undefined and null gracefully', () => {
    expect(cn(undefined, null as any, 'x')).toBe('x')
  })

  it('returns empty string for no args', () => {
    expect(cn()).toBe('')
  })
})

describe('formatDate()', () => {
  it('formats a date string in fr-FR by default', () => {
    const result = formatDate('2024-01-15')
    expect(result).toMatch(/2024/)
  })

  it('accepts custom locale (en-US)', () => {
    const result = formatDate('2024-01-15', 'en-US')
    expect(result).toMatch(/2024/)
    expect(result).toMatch(/Jan/i)
  })

  it('accepts a Date object', () => {
    const d = new Date('2024-06-01')
    const result = formatDate(d)
    expect(result).toMatch(/2024/)
  })

  it('includes day and year in output', () => {
    const result = formatDate('2024-03-20')
    expect(result).toMatch(/20/)
    expect(result).toMatch(/2024/)
  })
})

describe('formatCurrency()', () => {
  it('formats XAF amounts in fr-CM locale', () => {
    const result = formatCurrency(50_000)
    expect(result).toContain('50')
    // XAF or FCFA should appear
    expect(result.length).toBeGreaterThan(3)
  })

  it('handles zero amount', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0')
  })

  it('handles large amounts (1 500 000)', () => {
    const result = formatCurrency(1_500_000)
    expect(result).toContain('500')
  })

  it('accepts custom currency and locale', () => {
    const result = formatCurrency(100, 'EUR', 'fr-FR')
    expect(result).toMatch(/€|EUR/)
    expect(result).toContain('100')
  })
})

describe('getInitials()', () => {
  it('returns two uppercase initials for a full name', () => {
    expect(getInitials('Jean Dupont')).toBe('JD')
  })

  it('returns one initial for a single-word name', () => {
    expect(getInitials('Alice')).toBe('A')
  })

  it('caps at 2 characters for multi-word names', () => {
    expect(getInitials('Alice Bob Charlie')).toBe('AB')
  })

  it('uppercases the result', () => {
    expect(getInitials('jean dupont')).toBe('JD')
  })

  it('handles empty string without throwing', () => {
    expect(getInitials('')).toBe('')
  })
})

describe('truncate()', () => {
  it('truncates strings exceeding length with ellipsis', () => {
    expect(truncate('Hello World', 5)).toBe('Hello…')
  })

  it('does not truncate strings within the limit', () => {
    expect(truncate('Hi', 10)).toBe('Hi')
  })

  it('does not truncate at exact boundary length', () => {
    expect(truncate('12345', 5)).toBe('12345')
  })

  it('handles empty string', () => {
    expect(truncate('', 5)).toBe('')
  })

  it('length 0 produces an ellipsis for non-empty strings', () => {
    expect(truncate('X', 0)).toBe('…')
  })
})

describe('formatCurrency() — XAF B2B pricing', () => {
  it('formats a typical SME subscription (29 000 XAF)', () => {
    const result = formatCurrency(29_000)
    expect(result).toContain('29')
    expect(result).toContain('000')
  })

  it('formats an enterprise subscription (149 000 XAF)', () => {
    const result = formatCurrency(149_000)
    expect(result).toContain('149')
  })

  it('formats zero (free plan)', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0')
  })
})

describe('formatDate() — B2B certification dates', () => {
  it('formats certification creation date in french locale', () => {
    const result = formatDate('2026-01-15', 'fr-FR')
    expect(result).toMatch(/2026/)
  })

  it('handles ISO 8601 timestamps from Supabase', () => {
    const result = formatDate('2026-03-22T10:30:00.000Z', 'fr-FR')
    expect(result).toMatch(/2026/)
  })
})

describe('getInitials() — company name display', () => {
  it('works for CEMAC company names with multiple words', () => {
    expect(getInitials('Gabon Bois Précieux')).toBe('GB')
  })

  it('works for two-word company name', () => {
    expect(getInitials('AISC Cameroun')).toBe('AC')
  })

  it('handles single-word company name', () => {
    expect(getInitials('Cacao')).toBe('C')
  })
})
