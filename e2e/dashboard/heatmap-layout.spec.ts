import { test, expect } from '@playwright/test'
import { mockAuthApis, loginViaForm } from '../utils/auth-helpers.js'

/**
 * Dashboard layout contract (container-query driven, component-width based):
 *
 * Panel grid: every card is exactly half width when a 2-col share stays
 * ≥830px wide (grid row ≥1684px — the 830px readability floor for the
 * weekly heatmap's 168 cells); below that the grid collapses to one column.
 *
 * SummaryCards: 6-across only when the row is ≥1430px (each card ≥224px);
 * below that 3-across (md) / 2-across (narrow).
 *
 * Both thresholds are container queries on the page column, so sidebar
 * collapse and future layout changes keep them honest.
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

test('panels collapse to one column when a 2-col card would drop under 830px', async ({ page }) => {
  await gotoDashboard(page, 1920)
  const c = await cardBoxes(page)
  // All cards share one full-width track and stack row by row.
  const widths = Object.values(c).map((v) => v.width)
  expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(4)
  const ys = Object.values(c).map((v) => v.y)
  for (let i = 1; i < ys.length; i++) expect(ys[i]).toBeGreaterThanOrEqual(ys[i - 1])
  expect(c['Coding heatmap'].y).not.toBe(c['Weekly coding activity by hour'].y)
})

test('panels pair two-across once a card keeps ≥830px', async ({ page }) => {
  await gotoDashboard(page, 2100)
  const c = await cardBoxes(page)
  for (const title of TITLES) expect(c[title].width, title).toBeGreaterThanOrEqual(825)
  expect(Math.abs(c['Coding heatmap'].y - c['Weekly coding activity by hour'].y)).toBeLessThan(4)
  expect(Math.abs(c['Average hourly coding duration'].y - c['Coding trend (last 30 days)'].y)).toBeLessThan(4)
  expect(c['Time of day distribution'].y).toBeGreaterThan(c['Coding trend (last 30 days)'].y)
})

test('summary cards go 6-across only when the row keeps ≥1430px', async ({ page }) => {
  await gotoDashboard(page, 2100)
  const wide = await page
    .getByTestId('summary-cards')
    .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length)
  expect(wide).toBe(6)
})

test('summary cards fall back to 3-across below the 1430px row', async ({ page }) => {
  await gotoDashboard(page, 1600)
  const narrow = await page
    .getByTestId('summary-cards')
    .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length)
  expect(narrow).toBe(3)
})
