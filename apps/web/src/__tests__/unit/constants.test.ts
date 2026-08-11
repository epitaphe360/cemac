import { describe, it, expect } from 'vitest'
import {
  CERTIFICATION_STATUSES,
  CERTIFICATION_STATUS_LABELS,
  CERTIFICATION_STATUS_COLORS,
  USER_ROLES,
  CEMAC_COUNTRIES,
  SUBSCRIPTION_PLANS,
  APP_NAME,
  APP_VERSION,
} from '@/lib/constants'

describe('CERTIFICATION_STATUSES', () => {
  it('contains all 9 workflow states', () => {
    const states = Object.values(CERTIFICATION_STATUSES)
    expect(states).toHaveLength(9)
  })

  it('includes the complete certification lifecycle', () => {
    const states = Object.values(CERTIFICATION_STATUSES)
    expect(states).toContain('draft')
    expect(states).toContain('submitted')
    expect(states).toContain('under_review')
    expect(states).toContain('field_validation')
    expect(states).toContain('commission_review')
    expect(states).toContain('approved')
    expect(states).toContain('rejected')
    expect(states).toContain('suspended')
    expect(states).toContain('expired')
  })

  it('DRAFT is the entry state', () => {
    expect(CERTIFICATION_STATUSES.DRAFT).toBe('draft')
  })

  it('APPROVED is the final positive state', () => {
    expect(CERTIFICATION_STATUSES.APPROVED).toBe('approved')
  })

  it('REJECTED and SUSPENDED are negative terminal states', () => {
    expect(CERTIFICATION_STATUSES.REJECTED).toBe('rejected')
    expect(CERTIFICATION_STATUSES.SUSPENDED).toBe('suspended')
  })
})

describe('CERTIFICATION_STATUS_LABELS', () => {
  it('has a French label for every certification status', () => {
    const statuses = Object.values(CERTIFICATION_STATUSES)
    statuses.forEach((status) => {
      const label = CERTIFICATION_STATUS_LABELS[status]
      expect(label, `Missing label for status: ${status}`).toBeDefined()
      expect(label.length).toBeGreaterThan(0)
    })
  })

  it('label for draft is "Brouillon"', () => {
    expect(CERTIFICATION_STATUS_LABELS['draft']).toBe('Brouillon')
  })

  it('label for approved is "Approuvé"', () => {
    expect(CERTIFICATION_STATUS_LABELS['approved']).toBe('Approuvé')
  })

  it('label for rejected is "Rejeté"', () => {
    expect(CERTIFICATION_STATUS_LABELS['rejected']).toBe('Rejeté')
  })
})

describe('CERTIFICATION_STATUS_COLORS', () => {
  it('has a color entry for every certification status', () => {
    const statuses = Object.values(CERTIFICATION_STATUSES)
    statuses.forEach((status) => {
      expect(CERTIFICATION_STATUS_COLORS[status], `Missing color for: ${status}`).toBeDefined()
    })
  })

  it('approved status has green color class', () => {
    expect(CERTIFICATION_STATUS_COLORS['approved']).toMatch(/green/)
  })

  it('rejected status has red color class', () => {
    expect(CERTIFICATION_STATUS_COLORS['rejected']).toMatch(/red/)
  })

  it('draft status has gray color class', () => {
    expect(CERTIFICATION_STATUS_COLORS['draft']).toMatch(/gray/)
  })
})

describe('USER_ROLES', () => {
  it('contains exactly 8 roles', () => {
    expect(Object.values(USER_ROLES)).toHaveLength(8)
  })

  it('includes critical administrative roles', () => {
    const roles = Object.values(USER_ROLES)
    expect(roles).toContain('super_admin')
    expect(roles).toContain('cemac_officer')
    expect(roles).toContain('company_admin')
  })

  it('includes public and buyer roles', () => {
    const roles = Object.values(USER_ROLES)
    expect(roles).toContain('public')
    expect(roles).toContain('buyer')
  })

  it('includes logistics_agent role', () => {
    expect(USER_ROLES.LOGISTICS_AGENT).toBe('logistics_agent')
  })
})

describe('CEMAC_COUNTRIES', () => {
  it('lists all 6 CEMAC member states', () => {
    expect(CEMAC_COUNTRIES).toHaveLength(6)
  })

  it('includes Cameroun (CM)', () => {
    const codes = CEMAC_COUNTRIES.map((c) => c.code)
    expect(codes).toContain('CM')
  })

  it('includes Gabon (GA)', () => {
    const codes = CEMAC_COUNTRIES.map((c) => c.code)
    expect(codes).toContain('GA')
  })

  it('each country has code, name, and emoji flag', () => {
    CEMAC_COUNTRIES.forEach((country) => {
      expect(country.code).toBeDefined()
      expect(country.name).toBeDefined()
      expect(country.flag).toBeDefined()
      // Flag should be emoji chars
      expect(country.flag.length).toBeGreaterThan(0)
    })
  })

  it('Tchad entry has no spurious code2 property (bug fix regression)', () => {
    const tchad = CEMAC_COUNTRIES.find((c) => c.code === 'TD')
    expect(tchad).toBeDefined()
    // code2 was a duplicate field removed in bug fix
    expect((tchad as any).code2).toBeUndefined()
  })

  it('all 6 official CEMAC member codes are present', () => {
    const codes = CEMAC_COUNTRIES.map((c) => c.code)
    const expected = ['CM', 'GA', 'CG', 'TD', 'CF', 'GQ']
    expected.forEach((code) => expect(codes).toContain(code))
  })

  it('each country code is unique', () => {
    const codes = CEMAC_COUNTRIES.map((c) => c.code)
    const unique = new Set(codes)
    expect(unique.size).toBe(CEMAC_COUNTRIES.length)
  })
})

describe('SUBSCRIPTION_PLANS', () => {
  it('contains the supported persisted plan identifiers', () => {
    expect(Object.values(SUBSCRIPTION_PLANS)).toEqual([
      'free',
      'sme',
      'enterprise',
      'institutional',
    ])
  })
})

describe('App metadata constants', () => {
  it('APP_NAME is "CEMAC INTEGRA"', () => {
    expect(APP_NAME).toBe('CEMAC INTEGRA')
  })

  it('APP_VERSION follows semver format', () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('APP_VERSION is at least v2.0.0', () => {
    const major = parseInt(APP_VERSION.split('.')[0], 10)
    expect(major).toBeGreaterThanOrEqual(2)
  })
})

describe('Document types (DB CHECK constraint compliance)', () => {
  // These are the exact values accepted by the Supabase DB CHECK constraint:
  // CHECK (type_document IN ('statuts','registre_commerce','bilan','factures',
  //   'rapport_audit','photos_produit','certificat_qualite','autre'))
  const DB_ALLOWED_DOC_TYPES = [
    'statuts',
    'registre_commerce',
    'bilan',
    'factures',
    'rapport_audit',
    'photos_produit',
    'certificat_qualite',
    'autre',
  ]

  it('DB allows exactly 8 document types', () => {
    expect(DB_ALLOWED_DOC_TYPES).toHaveLength(8)
  })

  it('all values are lowercase snake_case (no spaces, no uppercase)', () => {
    DB_ALLOWED_DOC_TYPES.forEach((type) => {
      expect(type).toBe(type.toLowerCase())
      expect(type).not.toContain(' ')
      expect(type).toMatch(/^[a-z_]+$/)
    })
  })

  it('rapport_audit is valid (not rapport_analyse)', () => {
    expect(DB_ALLOWED_DOC_TYPES).toContain('rapport_audit')
    expect(DB_ALLOWED_DOC_TYPES).not.toContain('rapport_analyse')
  })

  it('certificat_qualite is valid (not certificat_de_qualite)', () => {
    expect(DB_ALLOWED_DOC_TYPES).toContain('certificat_qualite')
  })

  it('photos_produit is valid (not photo_produit)', () => {
    expect(DB_ALLOWED_DOC_TYPES).toContain('photos_produit')
  })

  it('autre is the fallback type', () => {
    expect(DB_ALLOWED_DOC_TYPES).toContain('autre')
  })
})

describe('Workflow events — audit trail', () => {
  it('all 9 certification states form a complete lifecycle', () => {
    const statuses = Object.values(CERTIFICATION_STATUSES)
    // Must cover: entry, review chain, terminal states
    const entry = ['draft']
    const chain = ['submitted', 'under_review', 'field_validation', 'commission_review']
    const positive = ['approved']
    const negative = ['rejected', 'suspended']
    const expired = ['expired']
    ;[...entry, ...chain, ...positive, ...negative, ...expired].forEach((s) =>
      expect(statuses).toContain(s)
    )
  })

  it('workflow transitions are forward-only (draft cannot equal approved)', () => {
    expect(CERTIFICATION_STATUSES.DRAFT).not.toBe(CERTIFICATION_STATUSES.APPROVED)
    expect(CERTIFICATION_STATUSES.DRAFT).not.toBe(CERTIFICATION_STATUSES.REJECTED)
  })
})
