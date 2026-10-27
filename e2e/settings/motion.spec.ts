import { test, expect } from '@playwright/test'
import { mockAuthApis, loginViaForm } from '../utils/auth-helpers.js'

/**
 * Reduce-motion preference, end to end.
 *
 * The assertions that matter are the resolved effect, not the stored string: the
 * document-level stylesheet has to actually zero durations, the choice has to
 * outlive a reload, and forcing full motion has to beat a system that asks for
 * less. A spec that only checked the radio would pass while every animation kept
 * running.
 */

/**
 * Longest transition/animation duration anywhere in the document, in milliseconds.
 *
 * Read from computed styles rather than trusting the class or the attribute: the
 * whole point is that the document-level rule reached real elements. Chrome
 * reports these in seconds (`0.15s`), so the unit has to be honoured — a naive
 * `parseFloat` reads `0.01ms` as 0.01 *seconds* and would call the reduced state
 * animated.
 */
const probeMaxMotionMs = (page: import('@playwright/test').Page): Promise<number> =>
  page.evaluate(() => {
    const toMs = (value: string): number => {
      const trimmed = value.trim()
      if (trimmed.endsWith('ms')) return Number.parseFloat(trimmed)
      if (trimmed.endsWith('s')) return Number.parseFloat(trimmed) * 1000
      return 0
    }
    let max = 0
    for (const el of document.querySelectorAll('*')) {
      const style = getComputedStyle(el)
      for (const raw of `${style.transitionDuration},${style.animationDuration}`.split(',')) {
        const ms = toMs(raw)
        if (ms > max) max = ms
      }
    }
    return max
  })

/**
 * Animations the document is actually running.
 *
 * The computed-duration probe above cannot see the delay trap: an animation
 * whose duration was zeroed still runs, still honours its `animation-delay`,
 * and still holds its first frame — so a page could report "0.01ms everywhere"
 * while a headline sat invisible. This is the measure the rest of the suite
 * uses (`document.getAnimations()`), and it sees exactly that.
 */
const probeRunningAnimations = (page: import('@playwright/test').Page): Promise<number> =>
  page.evaluate(() => document.getAnimations().filter((a: Animation) => a.playState === 'running').length)

test.describe('Reduce motion', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthApis(page)
    await loginViaForm(page)
  })

  test('choosing reduce zeroes transitions across the app and survives a reload', async ({ page }) => {
    await page.goto('/settings/preferences')
    await expect(page.getByRole('heading', { name: 'Preferences' })).toBeVisible()

    // The suite runs with no system motion preference, so the baseline must animate.
    expect(await probeMaxMotionMs(page)).toBeGreaterThan(1)

    await page.getByText('Reduce motion', { exact: true }).click()

    await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduce')
    expect(await probeMaxMotionMs(page)).toBeLessThan(1)
    // Nothing may be left running: a zeroed duration still honours the delay
    // and holds the first frame, so a "0.01ms everywhere" page could still open
    // with a headline the visitor cannot see. Polled, because the click that
    // set the preference starts transitions of its own — the question is what
    // the page settles on, not what it happened to be running at that instant.
    await expect.poll(() => probeRunningAnimations(page)).toBe(0)
    // The resolved state is reported back instead of leaving the choice opaque.
    await expect(page.getByText('Current: Reduce motion')).toBeVisible()

    await page.reload()

    await expect(page.getByRole('heading', { name: 'Preferences' })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduce')
    // Painted before the bundle runs, so the first frame after reload is already still.
    expect(await probeMaxMotionMs(page)).toBeLessThan(1)

    // Restore the default so a later spec in the same context starts with motion.
    await page.getByText('Follow system', { exact: true }).click()
    await expect(page.locator('html')).not.toHaveAttribute('data-motion', /.*/)
    expect(await probeMaxMotionMs(page)).toBeGreaterThan(1)
  })

  test('forcing full motion overrides a system that asks for less', async ({ page }) => {
    // Emulate the OS preference at the browser level — the store reads the media
    // query, so this is the same signal a real visitor's system sends.
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/settings/preferences')
    await expect(page.getByRole('heading', { name: 'Preferences' })).toBeVisible()

    // Default is "Follow system": the emulate must already be honoured.
    expect(await probeMaxMotionMs(page)).toBeLessThan(1)
    await expect.poll(() => probeRunningAnimations(page)).toBe(0)
    await expect(page.getByText('Current: Reduce motion')).toBeVisible()

    await page.getByText('Full motion', { exact: true }).click()

    await expect(page.locator('html')).toHaveAttribute('data-motion', 'full')
    expect(await probeMaxMotionMs(page)).toBeGreaterThan(1)
    // The animations are not merely long again — they are running, which the
    // duration alone cannot tell (a delayed animation is long and idle).
    expect(await probeRunningAnimations(page)).toBeGreaterThan(0)
    await expect(page.getByText('Current: Full motion')).toBeVisible()

    // Back to following the system hands control back to the system signal: the
    // attribute says "reduce" again, because the system still asks for less.
    await page.getByText('Follow system', { exact: true }).click()
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduce')
    expect(await probeMaxMotionMs(page)).toBeLessThan(1)
    await expect.poll(() => probeRunningAnimations(page)).toBe(0)
  })

  test('the choice reaches the marketing page: no delayed entrance hides the copy', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.addInitScript(() => localStorage.setItem('ctt.motion', 'reduce'))
    await page.goto('/')
    await page.locator('.hero-fade-rise').first().waitFor({ state: 'attached' })

    // The entrance must not merely be short — it must not exist. A zeroed
    // animation still honours its delay and holds the `from` frame, so the copy
    // would sit at opacity 0 for the delay and open with pieces missing.
    const entrances = await page.evaluate(() => {
      const names = ['.hero-rise', '.hero-fade-rise'].map((sel) => {
        const el = document.querySelector(sel) as HTMLElement | null
        return el ? getComputedStyle(el).animationName : 'missing'
      })
      const copy = document.querySelector('.hero-fade-rise') as HTMLElement | null
      return { names, opacity: copy ? getComputedStyle(copy).opacity : null }
    })

    expect(entrances.names).toEqual(['none', 'none'])
    expect(entrances.opacity).toBe('1')
  })

  test('full motion keeps the marketing entrance, even when the system asks for less', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(() => localStorage.setItem('ctt.motion', 'full'))
    await page.goto('/')
    await page.locator('.hero-fade-rise').first().waitFor({ state: 'attached' })

    const names = await page.evaluate(() => {
      const el = document.querySelector('.hero-fade-rise') as HTMLElement | null
      return el ? getComputedStyle(el).animationName : 'missing'
    })

    expect(names).toBe('hero-fade-rise')
  })
})
