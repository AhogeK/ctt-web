import { test, expect } from '@playwright/test'
import { setupAchievementsPage, expectAchievementsRendered } from './helpers.js'
import { TEST_YEARLY_TOTAL } from './fixtures.js'

/**
 * Achievements page, end to end through the real router, query client and DOM.
 *
 * The unit tests cover the model's arithmetic; these cover the wiring those
 * tests cannot reach: that the nested route mounts inside the app shell, that
 * the payload reaches the grid, and that the rendered geometry actually puts the
 * artwork inside the completion ring (jsdom reports every `getBBox()` as zero,
 * so that claim is only checkable in a real browser).
 */
test.describe('Achievements page', () => {
  test('renders one card per (family, window) ladder from the payload', async ({ page }) => {
    await setupAchievementsPage(page)
    await expectAchievementsRendered(page)

    // 2 STREAK rungs collapse to one lifetime ladder; the other four fixtures are
    // one ladder each. One card per ladder, never one per badge.
    await expect(page.getByTestId('trophy-card')).toHaveCount(5)
    await expect(page.getByTestId('trophy-card').filter({ hasText: 'Streak' })).toHaveCount(1)
    await expect(page.getByText('2/2')).toBeVisible()
  })

  test('mounts inside the app shell, not as a bare view', async ({ page }) => {
    await setupAchievementsPage(page)
    await expectAchievementsRendered(page)

    // The route is nested under AppLayout. Registered flat, the page rendered
    // correctly but with no shell at all — invisible in a screenshot, so assert
    // the navigation the shell provides.
    await expect(page.getByRole('link', { name: 'Achievements' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
  })

  test('draws the artwork inside the completion ring on a completed ladder', async ({ page }) => {
    await setupAchievementsPage(page)
    await expectAchievementsRendered(page)

    /*
     * The ring is at the largest radius a 24-grid allows, so the artwork has to
     * fit inside it. Measured in the browser rather than trusted: the artwork
     * group's painted box must sit within the ring's inner edge, and its centre
     * must land on the grid centre. Before this was fixed the ring cut through
     * every artwork, by up to 2.58 units of 12.
     */
    const geometry = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('[data-testid="trophy-card"]')]
      return cards.map((card) => {
        const svg = card.querySelector('svg')!
        const group = [...svg.children].find((el) => el.tagName === 'g')!
        const ring = [...svg.children].find((el) => el.tagName === 'circle' && el.getAttribute('fill') === 'none')
        const box = svg.getBoundingClientRect()
        const unit = box.width / 24
        const strokeUnits = Number(svg.getAttribute('stroke-width') ?? 1.5)

        // Screen-space union of the artwork, converted back to viewBox units.
        let x0 = Infinity
        let y0 = Infinity
        let x1 = -Infinity
        let y1 = -Infinity
        for (const el of group.children) {
          const r = el.getBoundingClientRect()
          if (r.width === 0 && r.height === 0) continue
          x0 = Math.min(x0, (r.left - box.left) / unit)
          y0 = Math.min(y0, (r.top - box.top) / unit)
          x1 = Math.max(x1, (r.right - box.left) / unit)
          y1 = Math.max(y1, (r.bottom - box.top) / unit)
        }
        const half = strokeUnits / 2
        x0 -= half
        y0 -= half
        x1 += half
        y1 += half

        const centre = [(x0 + x1) / 2, (y0 + y1) / 2]
        const reach = Math.max(
          Math.hypot(x0 - 12, y0 - 12),
          Math.hypot(x1 - 12, y0 - 12),
          Math.hypot(x0 - 12, y1 - 12),
          Math.hypot(x1 - 12, y1 - 12),
        )
        const ringRadius = ring ? Number(ring.getAttribute('r')) : null
        const ringStroke = ring ? Number(ring.getAttribute('stroke-width')) : null
        return {
          reach,
          // Null when the ladder is not complete, so the caller can skip it.
          ringInner: ringRadius === null ? null : ringRadius - (ringStroke ?? 0) / 2,
          centre,
        }
      })
    })

    expect(geometry.length).toBeGreaterThan(0)

    // Every card, ringed or not, must be centred on the 24-grid within half a unit.
    const offCentre = geometry.filter(
      (art) => Math.abs(art.centre[0]! - 12) >= 0.5 || Math.abs(art.centre[1]! - 12) >= 0.5,
    )
    expect(offCentre).toEqual([])

    // Collect the ringed cards first, then assert over the collection: a per-item
    // `if` around an expect can silently skip the assertion entirely.
    const ringed = geometry.filter((art) => art.ringInner !== null)
    expect(ringed.length, 'a completed ladder must be present or this check is vacuous').toBeGreaterThan(0)

    const overflowing = ringed.filter((art) => art.reach > art.ringInner!)
    expect(overflowing).toEqual([])
  })

  test('shows the period history, with the flame and a zero run included', async ({ page }) => {
    await setupAchievementsPage(page)
    await expectAchievementsRendered(page)

    const daily = page.locator('[data-trophy="TOTAL_SECONDS:DAY"]')
    // The history survives a period that has not been reached: 13 periods
    // reached while this one is still open.
    await expect(daily.getByTestId('trophy-reached')).toHaveText('13 days reached')
    // Zero is rendered, not hidden — the row's presence never carries meaning.
    await expect(daily.getByTestId('trophy-streak')).toContainText('🔥')
    await expect(daily.getByTestId('trophy-streak')).toContainText('0')
    // The flame is decorative; the count is announced with its unit.
    await expect(daily.getByTestId('trophy-streak')).toHaveAttribute('aria-label', 'Reached 0 days in a row')

    // A ladder never reached in any period states its zero rather than hiding.
    await expect(page.locator('[data-trophy="TOTAL_SECONDS:YEAR"]').getByTestId('trophy-reached')).toHaveText(
      '0 years reached',
    )
  })

  test('labels each window and dates the period it measures', async ({ page }) => {
    await setupAchievementsPage(page)
    await expectAchievementsRendered(page)

    // The window noun is the only thing separating same-family ladders.
    await expect(page.locator('[data-trophy="TOTAL_SECONDS:DAY"]').getByTestId('trophy-window')).toHaveText('Today')

    const dayGroup = page.locator('[data-window-group="DAY"]')
    // A DAY window begins and ends on the same date, so the range collapses.
    await expect(dayGroup.getByTestId('window-range')).toHaveText('Sep 14')
    await expect(dayGroup).toHaveAttribute('role', 'group')
    await expect(dayGroup).toHaveAttribute('aria-label', 'Today')

    // A lifetime trophy has no window to name and no deadline to state.
    const lifetime = page.getByTestId('section-lifetime')
    await expect(lifetime.getByTestId('window-range')).toHaveCount(0)
    await expect(lifetime.getByTestId('trophy-history')).toHaveCount(0)
  })

  test('shows the empty state when the payload has no badges', async ({ page }) => {
    await setupAchievementsPage(page, [])

    await expect(page.getByText('No achievements yet')).toBeVisible()
    await expect(page.getByTestId('trophy-card')).toHaveCount(0)
    // Nothing to count, so the header summary stays hidden rather than claiming 0%.
    await expect(page.getByTestId('achievement-summary')).toBeHidden()
  })

  test('renders a ladder that has never been reached without an error state', async ({ page }) => {
    // The zero case end to end, including the year ladder whose two values are 0.
    await setupAchievementsPage(page, [TEST_YEARLY_TOTAL])
    await expectAchievementsRendered(page)

    await expect(page.getByTestId('trophy-card')).toHaveCount(1)
    await expect(page.getByTestId('trophy-history')).toBeVisible()
    await expect(page.getByTestId('trophy-tier-count')).toHaveText('0/1')
  })

  test('keeps the trophy grid free of overflow', async ({ page }) => {
    await setupAchievementsPage(page)
    await expectAchievementsRendered(page)

    const overflowing = await page.evaluate(() =>
      [...document.querySelectorAll('[data-testid="trophy-card"]')]
        .filter((el) => el.scrollWidth > el.clientWidth + 1)
        .map((el) => el.getAttribute('data-trophy')),
    )
    expect(overflowing).toEqual([])

    // Lifetime and current-period are distinct sections, not one merged list:
    // fixture is 3 lifetime ladders (STREAK, PERFECT_MONTH) + 3 windowed
    // (DAY, WEEK, YEAR).
    await expect(page.getByTestId('section-lifetime').getByTestId('trophy-card')).toHaveCount(2)
    await expect(page.getByTestId('section-active').getByTestId('trophy-card')).toHaveCount(3)
  })
})
