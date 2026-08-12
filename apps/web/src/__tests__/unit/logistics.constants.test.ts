import { describe, it, expect } from 'vitest'
import {
  CEMAC_COUNTRIES,
  CONVOY_STATUSES,
  CONVOY_STATUS_LABELS,
  EXPEDITION_STATUSES,
  STATUS_LABELS,
  NEXT_STATUSES,
  NEXT_CONVOY_STATUSES,
  DOCUMENT_MIME_TYPES,
  MAX_DOCUMENT_SIZE,
} from '@/pages/logistics/logistics.constants'

describe('logistics.constants — expeditions', () => {
  it('lists all 6 expedition workflow statuses', () => {
    expect(EXPEDITION_STATUSES).toHaveLength(6)
    expect(EXPEDITION_STATUSES).toEqual([
      'draft', 'ready', 'in_transit', 'checkpoint_hold', 'delivered', 'cancelled',
    ])
  })

  it('has FR/EN labels for every expedition status', () => {
    EXPEDITION_STATUSES.forEach((status) => {
      expect(STATUS_LABELS[status].fr.length).toBeGreaterThan(0)
      expect(STATUS_LABELS[status].en.length).toBeGreaterThan(0)
    })
  })

  it('matches DB-valid status transitions', () => {
    expect(NEXT_STATUSES.draft).toEqual(['ready', 'cancelled'])
    expect(NEXT_STATUSES.in_transit).toContain('checkpoint_hold')
    expect(NEXT_STATUSES.delivered).toEqual([])
  })
})

describe('logistics.constants — convoys', () => {
  it('lists all 5 convoy statuses', () => {
    expect(CONVOY_STATUSES).toHaveLength(5)
  })

  it('has FR/EN labels for every convoy status', () => {
    CONVOY_STATUSES.forEach((status) => {
      expect(CONVOY_STATUS_LABELS[status].fr.length).toBeGreaterThan(0)
      expect(CONVOY_STATUS_LABELS[status].en.length).toBeGreaterThan(0)
    })
  })

  it('matches DB-valid convoy transitions', () => {
    expect(NEXT_CONVOY_STATUSES.draft).toEqual(['planned', 'cancelled'])
    expect(NEXT_CONVOY_STATUSES.operational).toEqual(['completed', 'cancelled'])
  })
})

describe('logistics.constants — documents', () => {
  it('allows only DB-permitted MIME types', () => {
    expect(DOCUMENT_MIME_TYPES).toEqual([
      'application/pdf', 'image/jpeg', 'image/png', 'image/webp',
    ])
  })

  it('enforces 10 MB max upload size', () => {
    expect(MAX_DOCUMENT_SIZE).toBe(10 * 1024 * 1024)
  })
})

describe('logistics.constants — CEMAC countries', () => {
  it('lists all 6 member state codes used by DB CHECK constraints', () => {
    expect(CEMAC_COUNTRIES).toEqual(['CM', 'CF', 'CG', 'GA', 'GQ', 'TD'])
  })
})
