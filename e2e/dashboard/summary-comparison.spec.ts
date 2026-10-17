import { test, expect } from '@playwright/test'
import { mockAuthApis, loginViaForm, okEnvelope } from '../utils/auth-helpers.js'

/**
 * The summary row's period-over-period change lines (ctt-server v0.78.0 `comparisons`).
 *
 * The payload mirrors the real contract: five comparable metrics, `total` absent, and a null
 * percent stands for "no baseline" (empty previous period / first coding day for dailyAverage).
 */
const SUMMARY = {
  today: 3600,
  dailyAverage: 7200,
  thisWeek: 5400,
  thisMonth: 86400,
  thisYear: 241959,
  total: 90000,
  comparisons: {
    today: { previousSeconds: 7200, changePercent: -50 },
    dailyAverage: { previousSeconds: 0, changePercent: null },
    thisWeek: { previousSeconds: 7200, changePercent: 25 },
    thisMonth: { previousSeconds: 108000, changePercent: 8.55 },
    thisYear: { previousSeconds: 1200000, changePercent: 0 },
  },
}

async function gotoDashboard(page: import('@playwright/test').Page, width: number) {
  await page.setViewportSize({ width, height: 1080 })
  await mockAuthApis(page)
  await page.route('**/api/v1/stats/summary**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(okEnvelope(SUMMARY)) }),
  )
  await loginViaForm(page)
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: 'Coding heatmap' })).toBeVisible()
  await expect(page.getByTestId('summary-comparison').first()).toBeVisible()
}

test('summary cards carry one change line per comparable metric, never on Total', async ({ page }) => {
  await gotoDashboard(page, 1600)

  const lines = page.getByTestId('summary-comparison')
  await expect(lines).toHaveCount(4)
  await expect(lines.first()).toContainText('-50%')
  await expect(lines.first()).toContainText('vs yesterday')

  // The lifetime figure has no previous period — its card never grows a delta line.
  const totalCard = page.locator('[data-testid="summary-cards"] > div').filter({ hasText: 'Total' })
  await expect(totalCard.getByTestId('summary-comparison')).toHaveCount(0)
})

test('change lines stay inside the cards at phone widths', async ({ page }) => {
  await gotoDashboard(page, 390)

  await expect(page.getByTestId('summary-comparison')).toHaveCount(4)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBe(0)

  // Every line keeps its own box on ONE line: nothing spills past its card and nothing wraps.
  const rows = await page.getByTestId('summary-comparison').evaluateAll((els) =>
    els.map((el) => {
      const box = el.getBoundingClientRect()
      return { width: Math.round(box.width), height: Math.round(box.height), scrollWidth: el.scrollWidth }
    }),
  )
  for (const row of rows) {
    expect(row.scrollWidth, 'the delta line stays inside its card').toBeLessThanOrEqual(row.width + 1)
    expect(row.height, 'the delta line stays on one line').toBeLessThanOrEqual(20)
  }

  // The trend icon is a fixed-size glyph: as the row's only shrinkable item it
  // used to be squeezed flat on narrow cards (8.8×12 measured), which is what
  // the arrow must never do — direction is the whole point of the glyph.
  const icons = await page.getByTestId('summary-comparison').evaluateAll((els) =>
    els.flatMap((el) => {
      const svg = el.querySelector('svg')
      if (!svg) return []
      const box = svg.getBoundingClientRect()
      return [{ w: +box.width.toFixed(1), h: +box.height.toFixed(1) }]
    }),
  )
  expect(icons.length, 'at least one delta line carries an icon').toBeGreaterThan(0)
  for (const icon of icons) {
    expect(Math.abs(icon.w - icon.h), 'the delta icon keeps a square box').toBeLessThanOrEqual(0.5)
  }
})
