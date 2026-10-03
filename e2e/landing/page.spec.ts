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

    // The landing page's acceptance: within the first screen the visitor must be able to tell
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

    // The first screen is the pitch (headline + action); the demo window is its own step just below,
    // so it arrives after a short scroll rather than competing with the headline for the same screen.
    await expect(page.getByTestId('landing-primary-cta')).toBeInViewport()
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.9))
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

  test('raises each beat into the centre of the same stage', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    // The entrance is a timed animation; wait for its end state rather than for a duration.
    await expect(page.locator('[data-testid="hero-preview"]').locator('..')).toHaveCSS('opacity', '1')

    // Beat 2 arrives at the centre of the viewport, not somewhere below the fold: the stage is pinned
    // and the layer is translated to -50% of its own height from the middle. That is the whole
    // mechanism, and this is the only place it can be checked.
    // The beat parks from 332svh and the stage unpins at 380svh, so the check has to land between
    // them: past the park point, short of the unpin — past that the whole stage is dragged upward by
    // the document and every rect moves with it.
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 3.6))
    // Poll instead of sleeping: the beat must actually arrive within ±4px of the centre, and a fixed
    // wait would both slow the suite and hide a beat that never gets there.
    const centred = async () =>
      page.evaluate(() => {
        const beat = document.querySelector('[data-testid="landing-beat-activity"]') as HTMLElement
        const rect = beat.getBoundingClientRect()
        const centre = (window.innerHeight - rect.height) / 2
        return { offset: Math.round(rect.top - centre), opacity: Number(getComputedStyle(beat).opacity) }
      })
    await expect
      .poll(async () => Math.abs((await centred()).offset), { message: 'beat never parked at the centre' })
      .toBeLessThanOrEqual(4)
    expect((await centred()).opacity).toBeGreaterThan(0.8)

    // And the beat really is the product's artefact: a year of days plus the cabinet's ladders,
    // which share the beat because they answer the same question.
    const activity = page.getByTestId('landing-beat-activity')
    await expect(activity.locator('[data-date]')).toHaveCount(364)
    await expect(activity.getByTestId('trophy-card')).toHaveCount(3)
    await expect(activity.getByText('Example data')).toBeVisible()
  })

  test('keeps the stage inside a phone viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await expect(page.getByTestId('landing-beat-activity')).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })
})
