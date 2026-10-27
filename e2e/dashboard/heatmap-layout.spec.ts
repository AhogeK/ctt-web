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
  'Long-term trend',
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
  // Row 2b — the long-term trend card owns a full row to itself.
  expect(c['Long-term trend'].width).toBeGreaterThan(c['Coding heatmap'].width * 1.8)
  expect(c['Long-term trend'].y).toBeGreaterThan(c['Coding trend'].y)
  expect(c['Weekly coding activity by hour'].y).toBeGreaterThan(c['Long-term trend'].y)
  // Row 3 — the two rhythm views.
  expect(Math.abs(c['Weekly coding activity by hour'].y - c['Average hourly coding duration'].y)).toBeLessThan(4)
  // Row 4 — the time-of-day split and the session log. The full-width
  // long-term card splits the pairs into rows 2 and 3; these assertions
  // catch a panel being appended out of order.
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

/** Seven past active days with distinct hourly peaks — exercises the five-curve cap. */
function hourlyDayCurves(): { date: string; hourlySeconds: number[] }[] {
  return ['2026-09-24', '2026-09-25', '2026-09-26', '2026-09-27', '2026-09-28', '2026-09-29', '2026-09-30'].map(
    (date, i) => ({
      date,
      hourlySeconds: Array.from({ length: 24 }, (_, hour) => (hour === 9 + (i % 3) ? 3600 : 0)),
    }),
  )
}

async function gotoHeatmap(page: import('@playwright/test').Page, width: number) {
  await page.setViewportSize({ width, height: 1080 })
  await mockAuthApis(page)
  await page.route('**/api/v1/stats/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    let data: unknown = null
    if (path.endsWith('/stats/heatmap')) data = { points: denseDays(371) }
    else if (path.endsWith('/stats/hourly')) {
      data = {
        points: [
          { hour: 9, averageSeconds: 3600 },
          { hour: 14, averageSeconds: 1800 },
        ],
        activeDays: 7,
      }
    } else if (path.endsWith('/stats/hourly-days')) {
      data = { days: hourlyDayCurves(), activeDays: 7 }
    } else if (path.endsWith('/stats/streaks')) data = { current: 3, max: 12 }
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

test('the hourly card draws the day curves and names them', async ({ page }) => {
  await gotoHeatmap(page, 1920)
  const card = page
    .locator('main section')
    .filter({ has: page.getByRole('heading', { name: 'Average hourly coding duration' }) })
  await card.scrollIntoViewIfNeeded()
  await expect(card.locator('canvas')).toBeVisible()
  await expect(card.getByText('based on 7 active days')).toBeVisible()
  await expect(card.getByText('faint lines: the last 5 days')).toBeVisible()
})

test('the hourly card sheds the day-curve note on phone panels', async ({ page }) => {
  await gotoHeatmap(page, 390)
  const card = page
    .locator('main section')
    .filter({ has: page.getByRole('heading', { name: 'Average hourly coding duration' }) })
  await card.scrollIntoViewIfNeeded()
  await expect(card.locator('canvas')).toBeVisible()
  await expect(card.getByText('based on 7 active days')).toBeVisible()
  await expect(card.getByText('faint lines')).toHaveCount(0)
})

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
  // Two dropdown round-trips plus scroll-metric polls, so this is one of the heavier flows in the
  // suite. It used to need a raised ceiling: a local run pointed every spec at one dev server,
  // which translated modules on demand and became the bottleneck, and this spec was the one that
  // ran out of time under that load. The suite now runs against the production build (see
  // `playwright.config.ts`), so the default ceiling is enough again.
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
  // A fresh read here raced the re-anchor: the poll above can settle while the
  // strip is still scrolling. Poll the final position too — same threshold.
  await expect
    .poll(async () => (await stripMetrics()).sl, { message: 'the strip opens at today, not at an edge' })
    .toBeGreaterThan(60)
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

test('long-term trend card carries the baseline story in DOM and aria', async ({ page }) => {
  await gotoHeatmap(page, 2100)
  const card = page
    .locator('main section')
    .filter({ has: page.getByRole('heading', { name: 'Long-term trend', exact: true }) })
  await card.scrollIntoViewIfNeeded()
  await expect(card.locator('canvas')).toBeVisible()
  // The mocked days alternate 5,400s and 0s, so the window mean is a real
  // baseline: the badge, the caption and the aria label must all carry it.
  await expect(card.getByTestId('long-term-delta')).toContainText('vs 12-month average')
  await expect(card.getByTestId('long-term-note')).toContainText('12-month average')
  await expect(card.locator('[role="img"]')).toHaveAttribute('aria-label', /12-month average/)
  await expect(card.locator('[role="img"]')).toHaveAttribute('aria-label', /Last \d+ days average/)
})

test('long-term trend card stays inside the phone panel', async ({ page }) => {
  await gotoHeatmap(page, 390)
  const card = page
    .locator('main section')
    .filter({ has: page.getByRole('heading', { name: 'Long-term trend', exact: true }) })
  await card.scrollIntoViewIfNeeded()
  await expect(card.locator('canvas')).toBeVisible()
  await expect(card.getByTestId('long-term-note')).toBeVisible()
  const box = await card.boundingBox()
  expect(box!.x + box!.width).toBeLessThanOrEqual(390 + 1)
})

test('the long-term delta icon keeps its square box at phone widths', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1080 })
  await mockAuthApis(page)
  await page.route('**/api/v1/stats/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    let data: unknown = null
    if (path.endsWith('/stats/heatmap')) {
      // A lower recent 30 forces a downward delta (and therefore the icon).
      const points = denseDays(371).map((p, i, all) => ({ ...p, seconds: i >= all.length - 30 ? 600 : p.seconds }))
      data = { points }
    } else if (path.endsWith('/stats/streaks')) data = { current: 3, max: 12 }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(okEnvelope(data)) })
  })
  await loginViaForm(page)
  await page.goto('/dashboard')
  const card = page
    .locator('main section')
    .filter({ has: page.getByRole('heading', { name: 'Long-term trend', exact: true }) })
  await card.scrollIntoViewIfNeeded()
  await expect(card.getByTestId('long-term-delta')).toBeVisible()
  const box = await card.getByTestId('long-term-delta').evaluate((el) => {
    const svg = el.querySelector('svg')!
    const rect = svg.getBoundingClientRect()
    return { w: +rect.width.toFixed(1), h: +rect.height.toFixed(1) }
  })
  expect(Math.abs(box.w - box.h), 'the delta icon keeps a square box').toBeLessThanOrEqual(0.5)
})

test('the long-term trend card picks its own year window', async ({ page }) => {
  await page.setViewportSize({ width: 2100, height: 1080 })
  await mockAuthApis(page)
  const seen: string[] = []
  await page.route('**/api/v1/stats/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname
    let data: unknown = null
    if (path.endsWith('/stats/heatmap')) {
      seen.push(url.search)
      data = { points: denseDays(371) }
    } else if (path.endsWith('/stats/heatmap-years')) {
      data = [2026, 2025]
    } else if (path.endsWith('/stats/streaks')) {
      data = { current: 3, max: 12 }
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(okEnvelope(data)) })
  })
  await loginViaForm(page)
  await page.goto('/dashboard')

  const card = page
    .locator('main section')
    .filter({ has: page.getByRole('heading', { name: 'Long-term trend', exact: true }) })
  await card.scrollIntoViewIfNeeded()

  // A past year: the full calendar frame, and the baseline renames itself.
  await card.getByTestId('long-term-year-select').click()
  await page.getByRole('option', { name: '2025', exact: true }).click()
  await expect
    .poll(() => seen.filter((s) => s.includes('start=2025-01-01') && s.includes('end=2025-12-31')).length, {
      message: 'the picked year asks for its full Jan–Dec frame',
    })
    .toBe(1)
  await expect(card.getByTestId('long-term-note')).toContainText('2025 average')
  // The heatmap never followed — the two windows are independent.
  expect(seen.filter((s) => s.includes('start=2025-01-01'))).toHaveLength(1)

  // The current year is clamped to today: future zero days would poison the
  // averages the card prints.
  const now = new Date()
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  await card.getByTestId('long-term-year-select').click()
  await page.getByRole('option', { name: '2026', exact: true }).click()
  await expect.poll(() => seen.some((s) => s.includes('start=2026-01-01') && s.includes(`end=${todayIso}`))).toBe(true)
  await expect(card.getByTestId('long-term-note')).toContainText('2026 average')
})
