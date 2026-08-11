import { test, expect } from '@playwright/test'

test.describe('Company Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/register')
  })

  test('registration page loads and shows step 1', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible()
    // Title or heading should be present
    const heading = page.getByRole('heading').first()
    await expect(heading).toBeVisible()
  })

  test('step 1: empty form shows email validation error', async ({ page }) => {
    await page.getByRole('button', { name: /suivant/i }).click()
    await expect(page.getByText(/email invalide/i)).toBeVisible({ timeout: 5000 })
  })

  test('step 1: invalid email format triggers validation', async ({ page }) => {
    await page.getByRole('textbox', { name: /email/i }).fill('notanemail')
    await page.getByRole('button', { name: /suivant/i }).click()
    await expect(page.getByText(/email invalide/i)).toBeVisible()
  })

  test('step 1: password shorter than 8 characters fails', async ({ page }) => {
    await page.getByRole('textbox', { name: /email/i }).fill('test@cemac.com')
    await page.locator('input[type="password"]').first().fill('short')
    await page.getByRole('button', { name: /suivant/i }).click()
    await expect(page.getByText(/minimum 8/i)).toBeVisible()
  })

  test('step 1 → step 2: valid data advances the form', async ({ page }) => {
    await page.getByRole('textbox', { name: /email/i }).fill(`user${Date.now()}@test.com`)
    await page.locator('input[type="password"]').first().fill('Secure123!')
    // Fill full_name — try various label patterns
    const nameField =
      page.getByRole('textbox', { name: /nom complet|full name/i }).first() ||
      page.getByPlaceholder(/jean dupont|votre nom/i).first()
    await nameField.fill('Jean Dupont')
    // Click next
    await page.getByRole('button', { name: /suivant/i }).click()
    // Step 2 should mention entreprise / raison sociale
    await expect(
      page.getByText(/raison sociale|entreprise|société/i).first(),
    ).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Registration — navigation guards', () => {
  test('unauthenticated access to /dashboard redirects to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/login|connexion/i)
  })

  test('login page is accessible from registration', async ({ page }) => {
    await page.goto('/auth/register')
    const loginLink = page.getByRole('link', { name: /connexion|se connecter|déjà un compte/i })
    await expect(loginLink).toBeVisible()
    await loginLink.click()
    await expect(page).toHaveURL(/login|connexion/i)
  })
})
