import { test, expect } from '@playwright/test'
import { mockAuthApis, loginViaForm } from '../utils/auth-helpers.js'

/**
 * Dashboard layout contract (uniform grid, zero width privileges):
 * - Every panel card is exactly half the content width at ≥lg — heatmap
 *   included (its cell renderer clamps to the available width). No card is
 *   wider than another; nothing spans a full row.
 * - Cards flow 2-across, so consecutive pairs share a top line; the odd
 *   trailing card (time of day) starts a fresh row.
 */

const TITLES = [
  'Coding heatmap',
  'Weekly coding activity by hour',
  'Average hourly coding duration',
  'Coding trend (last 30 days)',
  'Time of day distribution',
] as const

async function gotoDashboard(page: import('@playwright/test').Page, width: number) {
  await page.setViewportSize({ width, height: 1080 })
  await mockAuthApis(page)
  await loginViaForm(page)
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: 'Coding heatmap' })).toBeVisible()
}

/** Section-card bounding boxes keyed by their <h2> title. */
async function cardBoxes(page: import('@playwright/test').Page) {
  const out: Record<string, { x: number; y: number; width: number }> = {}
  for (const title of TITLES) {
    const box = await page
      .locator('main section')
      .filter({ has: page.getByRole('heading', { name: title, exact: true }) })
      .boundingBox()
    expect(box, `card "${title}" must render`).not.toBeNull()
    out[title] = { x: box!.x, y: box!.y, width: box!.width }
  }
  return out
}

test('all panel cards are equal width at 1920 (no full-row span)', async ({ page }) => {
  await gotoDashboard(page, 1920)
  const cards = await cardBoxes(page)
  const widths = Object.values(cards).map((c) => c.width)
  const max = Math.max(...widths)
  const min = Math.min(...widths)
  // Uniform rhythm: every card within a hair of the same width, and none
  // stretches to the full content row (~1600 at this viewport).
  expect(max - min, 'cards must share one width').toBeLessThan(4)
  expect(max, 'no card may span the full row').toBeLessThan(1500)
})

test('cards pair two-across; consecutive rows share a top line', async ({ page }) => {
  await gotoDashboard(page, 1920)
  const c = await cardBoxes(page)
  // heatmap+weekly row 1, hourly+trend row 2 → each pair on one top line.
  expect(Math.abs(c['Coding heatmap'].y - c['Weekly coding activity by hour'].y)).toBeLessThan(4)
  expect(Math.abs(c['Average hourly coding duration'].y - c['Coding trend (last 30 days)'].y)).toBeLessThan(4)
  // The odd trailing card drops to its own row below the others.
  expect(c['Time of day distribution'].y).toBeGreaterThan(c['Coding trend (last 30 days)'].y)
})

test('left column aligns and right column aligns', async ({ page }) => {
  await gotoDashboard(page, 1920)
  const c = await cardBoxes(page)
  // Left-column cards share x; right-column cards share x.
  expect(Math.abs(c['Coding heatmap'].x - c['Average hourly coding duration'].x)).toBeLessThan(4)
  expect(Math.abs(c['Weekly coding activity by hour'].x - c['Coding trend (last 30 days)'].x)).toBeLessThan(4)
  expect(c['Weekly coding activity by hour'].x).toBeGreaterThan(c['Coding heatmap'].x)
})
