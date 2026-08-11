import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Pages to audit for accessibility
const PUBLIC_PAGES = [
  { name: 'Landing Page', path: '/' },
  { name: 'Login Page', path: '/auth/login' },
  { name: 'Register Page', path: '/auth/register' },
  { name: 'Marketplace Public', path: '/marketplace-public' },
  { name: 'Contact Page', path: '/contact' },
  { name: 'Pricing Page', path: '/tarifs' },
  { name: 'About Page', path: '/a-propos' },
]

for (const { name, path } of PUBLIC_PAGES) {
  test(`[A11y] ${name} — no critical WCAG 2.1 AA violations`, async ({ page }) => {
    await page.goto(path)
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    )

    if (criticalViolations.length > 0) {
      // Log details for debugging without failing immediately on minor issues
      console.log(
        `[${name}] Critical a11y violations:\n`,
        criticalViolations
          .map((v) => `  • [${v.impact}] ${v.id}: ${v.description}`)
          .join('\n'),
      )
    }

    expect(
      criticalViolations,
      `${name} has ${criticalViolations.length} critical accessibility violations`,
    ).toHaveLength(0)
  })
}

test('[A11y] Login form is keyboard navigable', async ({ page }) => {
  await page.goto('/auth/login')
  await page.waitForLoadState('networkidle')

  const emailField = page.getByRole('textbox', { name: /email/i })
  await emailField.focus()
  await expect(emailField).toBeFocused()

  // The recovery link is intentionally next in DOM order.
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: /mot de passe oublié/i })).toBeFocused()

  await page.keyboard.press('Tab')
  const passwordField = page.locator('input[type="password"]').first()
  await expect(passwordField).toBeFocused()
})

test('[A11y] Login page color contrast passes WCAG AA', async ({ page }) => {
  await page.goto('/auth/login')
  await page.waitForLoadState('networkidle')

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2aa'])
    .analyze()

  const contrastViolations = results.violations.filter((v) => v.id === 'color-contrast')
  expect(
    contrastViolations,
    `Login page has ${contrastViolations.length} color contrast issues`,
  ).toHaveLength(0)
})

test('[A11y] All images have alt text', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  const results = await new AxeBuilder({ page })
    .withRules(['image-alt'])
    .analyze()

  expect(
    results.violations.filter((v) => v.id === 'image-alt'),
    'Images missing alt text on landing page',
  ).toHaveLength(0)
})

test('[A11y] Form fields have labels', async ({ page }) => {
  await page.goto('/auth/register')
  await page.waitForLoadState('networkidle')

  const results = await new AxeBuilder({ page })
    .withRules(['label', 'label-title-only'])
    .analyze()

  const labelViolations = results.violations
  expect(labelViolations, 'Register form has unlabeled inputs').toHaveLength(0)
})
