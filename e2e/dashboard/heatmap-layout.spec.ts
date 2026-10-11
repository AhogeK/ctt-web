import { test, expect } from '@playwright/test'
import { mockAuthApis, loginViaForm, okEnvelope } from '../utils/auth-helpers.js'

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

/** In RENDER order — the y-monotonicity assertion below depends on it. */
const TITLES = [
  'Language distribution',
  'Project distribution',
  'Coding heatmap',
  'Coding trend',
  'Weekly coding activity by hour',
  'Average hourly coding duration',
  'Time of day distribution',
  'Recent sessions',
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
  expect(c['Language distribution'].y).not.toBe(c['Project distribution'].y)
})

test('panels pair two-across once a card keeps ≥830px', async ({ page }) => {
  await gotoDashboard(page, 2100)
  const c = await cardBoxes(page)
  for (const title of TITLES) expect(c[title].width, title).toBeGreaterThanOrEqual(825)
  // Row 1 — the two categorical shares.
  expect(Math.abs(c['Language distribution'].y - c['Project distribution'].y)).toBeLessThan(4)
  // Row 2 — the calendar and the trend.
  expect(Math.abs(c['Coding heatmap'].y - c['Coding trend'].y)).toBeLessThan(4)
  // Row 3 — the two rhythm views.
  expect(Math.abs(c['Weekly coding activity by hour'].y - c['Average hourly coding duration'].y)).toBeLessThan(4)
  // Row 4 — the time-of-day split and the session log. With eight panels every
  // row is a pair; this pairing is the assertion that catches a panel being
  // appended out of order.
  expect(Math.abs(c['Time of day distribution'].y - c['Recent sessions'].y)).toBeLessThan(4)
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

test('keeps the three filters on one line at phone widths', async ({ page }) => {
  await gotoDashboard(page, 390)
  const boxes = await page
    .locator('.filter-bar')
    .getByRole('combobox')
    .evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect()
        return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width) }
      }),
    )
  expect(boxes).toHaveLength(3)
  const ys = boxes.map((b) => b.y)
  expect(Math.max(...ys) - Math.min(...ys), 'the three filters share one row').toBeLessThanOrEqual(2)
  for (const b of boxes) expect(b.w, 'each control keeps a tappable width').toBeGreaterThanOrEqual(80)

  // The bar itself stays one control tall — stacked, it used to eat the whole
  // first screen before any numbers.
  const barH = await page
    .locator('.filter-bar')
    .evaluate((el) => Math.round((el as HTMLElement).getBoundingClientRect().height))
  expect(barH).toBeLessThanOrEqual(48)
})

/** Dense daily points ending today — enough for the heatmap to draw. */
function denseDays(days: number): { date: string; seconds: number }[] {
  const out: { date: string; seconds: number }[] = []
  const now = Date.now()
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(now - i * 86_400_000)
    out.push({ date: day.toISOString().slice(0, 10), seconds: i % 3 === 0 ? 0 : 5_400 })
  }
  return out
}

async function gotoHeatmap(page: import('@playwright/test').Page, width: number) {
  await page.setViewportSize({ width, height: 1080 })
  await mockAuthApis(page)
  await page.route('**/api/v1/stats/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    let data: unknown = null
    if (path.endsWith('/stats/heatmap')) data = { points: denseDays(371) }
    else if (path.endsWith('/stats/streaks')) data = { current: 3, max: 12 }
    else if (path.endsWith('/stats/distribution')) {
      data = {
        type: 'TIME_OF_DAY',
        entries: [
          { name: 'NIGHT', seconds: 49_020 },
          { name: 'MORNING', seconds: 54_600 },
          { name: 'DAYTIME', seconds: 68_430 },
          { name: 'EVENING', seconds: 76_487 },
        ],
      }
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(okEnvelope(data)) })
  })
  await loginViaForm(page)
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: 'Coding heatmap' })).toBeVisible()
  await page.locator('.heatmap-scroll').scrollIntoViewIfNeeded()
  await expect(page.locator('.heatmap-scroll canvas')).toBeVisible()
}

test('opens the heatmap strip on its newest end at phone widths', async ({ page }) => {
  await gotoHeatmap(page, 390)
  const s = await page.locator('.heatmap-scroll').evaluate((el) => {
    const e = el as HTMLElement
    return { sw: e.scrollWidth, cw: e.clientWidth, sl: e.scrollLeft }
  })
  expect(s.sw, 'a phone panel must scroll the strip, not squeeze the grid').toBeGreaterThan(s.cw + 40)
  expect(s.sw - (s.sl + s.cw), 'the default view is the newest end').toBeLessThanOrEqual(4)
})

test('fits the whole heatmap on one row at desktop width', async ({ page }) => {
  await gotoHeatmap(page, 1920)
  const s = await page.locator('.heatmap-scroll').evaluate((el) => {
    const e = el as HTMLElement
    return { sw: e.scrollWidth, cw: e.clientWidth }
  })
  expect(s.sw).toBeLessThanOrEqual(s.cw + 1)
})

test('a picked year asks for that full calendar year, not a rolling window', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 })
  await mockAuthApis(page)
  const seen: string[] = []
  await page.route('**/api/v1/stats/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname
    let data: unknown = null
    if (path.endsWith('/stats/heatmap')) {
      seen.push(url.search)
      data = { points: denseDays(60) }
    } else if (path.endsWith('/stats/heatmap-years')) {
      data = [2026, 2025]
    } else if (path.endsWith('/stats/streaks')) {
      data = { current: 3, max: 12 }
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(okEnvelope(data)) })
  })
  await loginViaForm(page)
  await page.goto('/dashboard')

  const heatmapCard = page
    .locator('main section')
    .filter({ has: page.getByRole('heading', { name: 'Coding heatmap' }) })
  await heatmapCard.getByTestId('heatmap-year-select').click()
  await page.getByRole('option', { name: '2025', exact: true }).click()
  await expect
    .poll(() => seen.some((s) => s.includes('start=2025-01-01') && s.includes('end=2025-12-31')), {
      message: 'a chosen year must own its full Jan–Dec frame',
    })
    .toBe(true)
})

/** Dense daily points for one calendar year. */
function daysInYear(year: number): { date: string; seconds: number }[] {
  const out: { date: string; seconds: number }[] = []
  const d = new Date(`${year}-01-01T00:00:00`)
  while (d.getFullYear() === year) {
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    out.push({ date: iso, seconds: out.length % 4 === 0 ? 0 : 5_400 })
    d.setDate(d.getDate() + 1)
  }
  return out
}

test('a year view anchors at its newest non-future day', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1080 })
  await mockAuthApis(page)
  const seen: string[] = []
  await page.route('**/api/v1/stats/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname
    let data: unknown = null
    if (path.endsWith('/stats/heatmap')) {
      seen.push(url.searchParams.get('start') ?? '')
      const start = url.searchParams.get('start') ?? ''
      data = { points: /^\d{4}-01-01$/.test(start) ? daysInYear(Number(start.slice(0, 4))) : denseDays(371) }
    } else if (path.endsWith('/stats/heatmap-years')) {
      data = [2026, 2025]
    } else if (path.endsWith('/stats/streaks')) {
      data = { current: 3, max: 12 }
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(okEnvelope(data)) })
  })
  await loginViaForm(page)
  await page.goto('/dashboard')

  const select = page
    .locator('main section')
    .filter({ has: page.getByRole('heading', { name: 'Coding heatmap' }) })
    .getByTestId('heatmap-year-select')
  const stripMetrics = () =>
    page.locator('.heatmap-scroll').evaluate((el) => {
      const e = el as HTMLElement
      return { sw: e.scrollWidth, cw: e.clientWidth, sl: Math.round(e.scrollLeft) }
    })

  // A past year: the frame is entirely behind us, so its last day is the
  // anchor — the strip sits at the absolute end.
  await select.click()
  await page.getByRole('option', { name: '2025', exact: true }).click()
  await expect.poll(() => seen.includes('2025-01-01')).toBe(true)
  await expect
    .poll(async () => {
      const s = await stripMetrics()
      return s.sw - (s.sl + s.cw)
    })
    .toBeLessThanOrEqual(4)

  // The current year keeps its full frame; the future cells flow past the
  // right edge instead of leading, so the anchor is today — the first screen
  // shows data months, not empty space.
  await select.click()
  await page.getByRole('option', { name: '2026', exact: true }).click()
  await expect.poll(() => seen.includes('2026-01-01')).toBe(true)
  await expect
    .poll(
      async () => {
        const m = await stripMetrics()
        return m.sw - (m.sl + m.cw)
      },
      { message: 'the strip re-anchors with the future tail beyond the right edge' },
    )
    .toBeGreaterThan(60)
  const s = await stripMetrics()
  expect(s.sl, 'the strip opens at today, not at an edge').toBeGreaterThan(60)
})

test('narrow panels drop the time-of-day hover chip', async ({ page }) => {
  // On a phone-width card the chip overlaps the title and clips on the card
  // edges — it is not painted at all; the legend already shows every value.
  await gotoHeatmap(page, 390)
  const tod = page
    .locator('main section')
    .filter({ has: page.getByRole('heading', { name: 'Time of day distribution' }) })
  await tod.scrollIntoViewIfNeeded()
  await expect(tod.locator('canvas')).toBeVisible()
  const canvas = await tod.locator('canvas').boundingBox()
  await page.mouse.move(canvas!.x + canvas!.width * 0.15, canvas!.y + canvas!.height / 2)
  // The hover must register first (the other three entries dim) — then the
  // chip staying hidden is the assertion, not a race.
  await expect(tod.locator('li.opacity-45')).toHaveCount(3)
  await expect(page.getByTestId('tod-info-chip')).toBeHidden()
})

test('wide panels keep the time-of-day hover chip', async ({ page }) => {
  await gotoHeatmap(page, 1920)
  const tod = page
    .locator('main section')
    .filter({ has: page.getByRole('heading', { name: 'Time of day distribution' }) })
  await tod.scrollIntoViewIfNeeded()
  await expect(tod.locator('canvas')).toBeVisible()
  const canvas = await tod.locator('canvas').boundingBox()
  await page.mouse.move(canvas!.x + canvas!.width * 0.3, canvas!.y + canvas!.height / 2)
  await expect(page.getByTestId('tod-info-chip')).toBeVisible()
})

test('tapping a segment pins it; tapping it again restores', async ({ page }) => {
  await gotoHeatmap(page, 390)
  const tod = page
    .locator('main section')
    .filter({ has: page.getByRole('heading', { name: 'Time of day distribution' }) })
  await tod.scrollIntoViewIfNeeded()
  await expect(tod.locator('canvas')).toBeVisible()
  const dimmed = () => tod.locator('li.opacity-45').count()
  const canvas = await tod.locator('canvas').boundingBox()
  const x = canvas!.x + canvas!.width * 0.15
  const y = canvas!.y + canvas!.height / 2

  await page.mouse.click(x, y)
  await expect.poll(dimmed, { message: 'the tapped segment dims the other three' }).toBe(3)

  await page.mouse.click(x, y)
  await expect.poll(dimmed, { message: 'a second tap on the same segment restores' }).toBe(0)
})
