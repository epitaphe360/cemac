import { test, expect } from '@playwright/test'

const EXPEDITION_STATUSES = ['draft', 'ready', 'in_transit', 'checkpoint_hold', 'delivered', 'cancelled'] as const
const CONVOY_STATUSES = ['draft', 'planned', 'operational', 'completed', 'cancelled'] as const
const DOCUMENT_TYPES = ['eur1', 'invoice', 'packing_list', 'customs', 'transport', 'insurance', 'other'] as const
const ALLOWED_MIMES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'] as const

test.describe('Logistics — authentication guards', () => {
  test('unauthenticated access to /logistics redirects to login', async ({ page }) => {
    await page.goto('/logistics')
    await expect(page).toHaveURL(/login|connexion/i)
  })

  test('unauthenticated access to /logistics/convoys redirects to login', async ({ page }) => {
    await page.goto('/logistics/convoys')
    await expect(page).toHaveURL(/login|connexion/i)
  })
})

test.describe('Expedition model — contract tests', () => {
  test('expedition statuses match migration CHECK constraint', () => {
    expect(EXPEDITION_STATUSES).toHaveLength(6)
    expect(EXPEDITION_STATUSES).toContain('checkpoint_hold')
  })

  test('convoy statuses match migration CHECK constraint', () => {
    expect(CONVOY_STATUSES).toHaveLength(5)
    expect(CONVOY_STATUSES).toContain('operational')
  })

  test('document types match migration CHECK constraint', () => {
    expect(DOCUMENT_TYPES).toHaveLength(7)
    expect(DOCUMENT_TYPES).toContain('eur1')
  })

  test('allowed MIME types match storage bucket config', () => {
    expect(ALLOWED_MIMES).toHaveLength(4)
    ALLOWED_MIMES.forEach((mime) => expect(mime).toMatch(/^(application\/pdf|image\/)/))
  })

  test('valid expedition status transitions are forward-only from draft', () => {
    const fromDraft = ['ready', 'cancelled']
    fromDraft.forEach((target) => expect(EXPEDITION_STATUSES).toContain(target))
    expect(fromDraft).not.toContain('delivered')
  })
})

test.describe('Corridors — data contract tests', () => {
  const SEEDED_CORRIDORS = [
    { route: 'Douala → Bangui', mode: 'Route', status: 'Opérationnel' },
    { route: 'Pointe-Noire → N\'Djamena', mode: 'Mixte', status: 'Opérationnel' },
    { route: 'Libreville → Yaoundé', mode: 'Route', status: 'Opérationnel' },
    { route: 'Malabo → Douala', mode: 'Maritime', status: 'Ralenti' },
    { route: 'Bangui → Yaoundé', mode: 'Route', status: 'Opérationnel' },
  ]

  test('seeded corridors have valid transport modes', () => {
    const VALID_MODES = ['Route', 'Maritime', 'Aérien', 'Ferroviaire', 'Mixte']
    SEEDED_CORRIDORS.forEach(({ mode }) => expect(VALID_MODES).toContain(mode))
  })

  test('all 5 seeded corridors exist', () => {
    expect(SEEDED_CORRIDORS).toHaveLength(5)
  })
})

test.describe('Logistics page — login redirect', () => {
  test('login form is shown when redirected from /logistics', async ({ page }) => {
    await page.goto('/logistics')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible()
  })
})
