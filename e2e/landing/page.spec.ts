import { test, expect } from '@playwright/test'
import { mockAuthApis, loginViaForm } from '../utils/auth-helpers.js'

/**
 * Landing page E2E.
 *
 * The page's contract in this stage: `/` renders without a session, and the
 * top-bar call to action points at the destination that matches the visitor's
 * state — registration when signed out, the dashboard when signed in.
 */
test.describe('Landing page', () => {
  test('renders for an unauthenticated visitor without redirecting', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByTestId('marketing-cta')).toHaveAttribute('href', '/auth/login')
  })

  test('leads with the product and keeps the account entry in the top bar', async ({ page }) => {
    await page.goto('/')

    // Two distinct roles: the hero sells the product (the IDE plugin — the thing
    // the data comes from), while the top bar answers "I already have an
    // account". Neither routes to registration: that page carries no OAuth
    // provider, so GitHub users would hit a dead end there; they reach signup
    // through the login page's "Create account" link.
    await expect(page.getByTestId('landing-primary-cta')).toHaveAttribute(
      'href',
      'https://plugins.jetbrains.com/plugin/29379',
    )
    await expect(page.getByTestId('marketing-cta')).toHaveAttribute('href', '/auth/login')
    await expect(page.locator('a[href="/auth/register"]')).toHaveCount(0)
  })

  test('shows the real product surface above the fold, labelled as example data', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 800 })
    await page.goto('/')

    // P3's acceptance: within the first screen the visitor must be able to tell
    // what this is, see one piece of real UI evidence, and reach the main CTA —
    // all before scrolling. The evidence is the real dashboard components
    // (SummaryStatGrid + the ranked list), not a screenshot, so it must carry no
    // image or canvas: that also keeps the LCP element text.
    await expect(page.getByRole('heading', { level: 1 })).toBeInViewport()
    await expect(page.getByTestId('landing-primary-cta')).toBeInViewport()
    await expect(page.getByTestId('hero-preview')).toBeInViewport()
    await expect(page.getByTestId('hero-preview').getByText('Example data')).toBeVisible()
    await expect(page.getByTestId('hero-preview').getByText(/total/i)).toBeVisible()
    await expect(page.locator('[data-testid="hero-preview"] img, [data-testid="hero-preview"] canvas')).toHaveCount(0)
  })

  test('stacks the first screen on a phone without a horizontal scrollbar', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')

    await expect(page.getByTestId('hero-preview')).toBeInViewport()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })

  test('points an authenticated visitor at the dashboard', async ({ page }) => {
    await mockAuthApis(page)
    await loginViaForm(page)

    await page.goto('/')

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByTestId('marketing-cta')).toHaveAttribute('href', '/dashboard')
    // One entry only: the sign-in affordance is the same control, relabelled.
    await expect(page.getByTestId('marketing-cta')).toHaveCount(1)
  })

  test('backs the hero with the full summary row and the trophy cabinet', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')

    // The proof band sits directly under the hero and is reachable by scrolling
    // — never below a capability list, which is the rule the stage was planned
    // around ("stack proof early": the product's own artefacts before any claim).
    const proof = page.getByTestId('landing-proof')
    await proof.scrollIntoViewIfNeeded()
    await expect(proof).toBeVisible()

    // Each fragment carries its own one-line explanation and its own example-data
    // label: a rendered UI without a caption is the failure mode this guards.
    await expect(proof.locator('[data-testid$="-caption"]')).toHaveCount(2)
    for (const caption of await proof.locator('[data-testid$="-caption"]').all()) {
      await expect(caption).not.toBeEmpty()
    }
    await expect(proof.getByText('Example data')).toHaveCount(2)

    // And the fragments really are the product's components: all six summary
    // figures (the hero shows three, so the set is new information here) and the
    // three trophy ladders.
    await expect(proof.getByTestId('summary-value')).toHaveCount(6)
    await expect(proof.getByTestId('trophy-card')).toHaveCount(3)
  })

  test('keeps the proof band inside a phone viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')

    await page.getByTestId('landing-proof').scrollIntoViewIfNeeded()
    await expect(page.getByTestId('landing-proof-trophies')).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })
})
