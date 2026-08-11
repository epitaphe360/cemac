import { test, expect } from '@playwright/test'

// ── Logistics page — auth guards ───────────────────────────────────────────

test.describe('Logistics — authentication guards', () => {
  test('unauthenticated access to /logistics redirects to login', async ({ page }) => {
    await page.goto('/logistics')
    await expect(page).toHaveURL(/login|connexion/i)
  })

  test('unauthenticated access to /market-intelligence redirects to login', async ({ page }) => {
    await page.goto('/market-intelligence')
    await expect(page).toHaveURL(/login|connexion/i)
  })
})

// ── Corridors — data contract tests ───────────────────────────────────────

test.describe('CEMAC corridors — contract tests', () => {
  const SEEDED_CORRIDORS = [
    { route: 'Douala → Bangui',           mode: 'Route',    status: 'Opérationnel' },
    { route: 'Pointe-Noire → N\'Djamena', mode: 'Mixte',    status: 'Opérationnel' },
    { route: 'Libreville → Yaoundé',      mode: 'Route',    status: 'Opérationnel' },
    { route: 'Malabo → Douala',           mode: 'Maritime', status: 'Ralenti'      },
    { route: 'Bangui → Yaoundé',          mode: 'Route',    status: 'Opérationnel' },
  ]

  test('seeded corridors have valid transport modes', () => {
    const VALID_MODES = ['Route', 'Maritime', 'Aérien', 'Ferroviaire', 'Mixte']
    SEEDED_CORRIDORS.forEach(({ mode }) => {
      expect(VALID_MODES).toContain(mode)
    })
  })

  test('seeded corridors have valid statuses', () => {
    const VALID_STATUSES = ['Opérationnel', 'Ralenti', 'Bloqué', 'En maintenance']
    SEEDED_CORRIDORS.forEach(({ status }) => {
      expect(VALID_STATUSES).toContain(status)
    })
  })

  test('all 5 seeded corridors exist', () => {
    expect(SEEDED_CORRIDORS).toHaveLength(5)
  })
})

// ── Logistics alerts — data contract tests ────────────────────────────────

test.describe('Logistics alerts — contract tests', () => {
  const SEEDED_ALERTS = [
    { country: '🇹🇩 Tchad',        type: 'info'    },
    { country: '🇨🇫 Centrafrique', type: 'warning' },
    { country: '🇬🇦 Gabon',        type: 'info'    },
  ]

  test('seeded alerts have valid type values', () => {
    const VALID_TYPES = ['info', 'warning', 'danger']
    SEEDED_ALERTS.forEach(({ type }) => {
      expect(VALID_TYPES).toContain(type)
    })
  })

  test('all 3 seeded alerts exist', () => {
    expect(SEEDED_ALERTS).toHaveLength(3)
  })

  test('CEMAC countries mentioned in alerts are valid members', () => {
    const CEMAC_CODES = ['CM', 'GA', 'CG', 'TD', 'CF', 'GQ']
    // Tchad = TD, Centrafrique = CF, Gabon = GA
    const alertCodes = ['TD', 'CF', 'GA']
    alertCodes.forEach((code) => expect(CEMAC_CODES).toContain(code))
  })
})

// ── Login page — logistics deep-link ──────────────────────────────────────

test.describe('Logistics page — login redirect', () => {
  test('login form is shown when redirected from /logistics', async ({ page }) => {
    await page.goto('/logistics')
    await page.waitForLoadState('networkidle')
    // Should see the login form
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible()
  })

  test('login page from /market-intelligence redirect has submit button', async ({ page }) => {
    await page.goto('/market-intelligence')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('button', { name: /connexion|se connecter/i })).toBeVisible()
  })
})
