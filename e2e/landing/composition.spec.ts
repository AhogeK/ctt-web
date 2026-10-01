import { test, expect, type Page } from '@playwright/test'
import { SNAPSHOT_DESKTOP } from './composition-snapshot.js'

/**
 * Composition checks for the landing page.
 *
 * Two families live here. The first four pin the **desktop** composition the user accepted (rectangles,
 * both themes agreeing, the fold, and the recorded baseline): they exist because the composition has
 * already been broken twice by well-meaning CSS, and because relationship checks alone cannot prove that
 * both themes did not drift *together*.
 *
 * The rest cover the **phone** motion. The phone keeps every block in normal flow (nothing pinned) and
 * gives each *region* — the intro, each demo window, the year-and-ladders block — a fade-in, a hold and a
 * fade-out, all driven by the visitor's own scrolling. The rules that took several rounds to settle:
 * every one of those pieces must fade gradually (no popping in or out), stay at full strength through
 * the middle of its passage, and leave as the unit it is read as.
 */
const VIEWPORT_PHONE = { width: 440, height: 956 }

/** Waits for the hero's entrance to finish. The session panel is animated on phones, so it is not used
 *  as a signal that the page has loaded. */
async function settleHero(page: Page) {
  await page.goto('/')
  await expect(page.locator('[data-testid="hero-preview"]').locator('..')).toHaveCSS('opacity', '1')
}

/**
 * Waits for two animation frames. Scroll-driven styles are recomputed with the scroll position, and
 * reading `getComputedStyle` forces that flush — so two frames are enough, and a wall-clock wait does
 * not belong in a test.
 */
const settleFrame = (page: Page) =>
  page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  )

const selectorRect = (page: Page, selector: string) =>
  page.evaluate((sel) => {
    const el = document.querySelector(sel) as HTMLElement | null
    if (!el) throw new Error(`no element for selector: ${sel}`)
    const b = el.getBoundingClientRect()
    return { top: b.top, bottom: b.bottom, left: b.left, right: b.right, width: b.width, height: b.height }
  }, selector)

const rectOf = (page: Page, testId: string) => selectorRect(page, `[data-testid="${testId}"]`)

test.describe('landing hero composition (desktop)', () => {
  for (const theme of ['light', 'dark'] as const) {
    test(`floats the session panel over the plane's top-right corner (${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme })
      await page.setViewportSize({ width: 1440, height: 900 })
      await settleHero(page)
      await expect(page.locator('[data-testid="hero-recent-panel"]')).toHaveCSS('opacity', '1')

      const panel = await rectOf(page, 'hero-recent-panel')
      const plane = await rectOf(page, 'hero-preview')

      await expect(page.locator('[data-testid="hero-recent-panel"]')).toHaveCSS('position', 'absolute')
      expect(panel.top, 'the panel should sit clearly above the plane').toBeLessThan(plane.top - 100)
      expect(panel.right, 'the panel should sit over the plane’s right half').toBeGreaterThan(
        plane.left + plane.width / 2,
      )
    })
  }

  test('places light and dark identically', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    // Geometry only: the dark card recipe sets `position: relative` where light leaves it `static`, which
    // moves nothing — measured delta across every rect is exactly 0.
    const read = async (theme: 'light' | 'dark') => {
      await page.emulateMedia({ colorScheme: theme })
      await settleHero(page)
      await expect(page.locator('[data-testid="hero-recent-panel"]')).toHaveCSS('opacity', '1')
      const [panel, plane, cta] = await Promise.all([
        rectOf(page, 'hero-recent-panel'),
        rectOf(page, 'hero-preview'),
        rectOf(page, 'landing-primary-cta'),
      ])
      const geometry = ({ top, bottom, left, right, width, height }: Record<string, number>) => ({
        top,
        bottom,
        left,
        right,
        width,
        height,
      })
      return { panel: geometry(panel), plane: geometry(plane), cta: geometry(cta) }
    }
    const light = await read('light')
    const dark = await read('dark')

    for (const part of ['panel', 'plane', 'cta'] as const) {
      for (const [key, value] of Object.entries(light[part])) {
        const other = dark[part][key as keyof typeof dark.panel]
        expect(
          Math.abs(other - value),
          `${part}.${key} moved between themes (${value} → ${other})`,
        ).toBeLessThanOrEqual(1)
      }
    }
  })

  test('keeps the action above the fold and the plane running past it', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 800 })
    await settleHero(page)

    const cta = await rectOf(page, 'landing-primary-cta')
    const plane = await rectOf(page, 'hero-preview')
    const viewportHeight = await page.evaluate(() => window.innerHeight)

    expect(cta.bottom).toBeLessThanOrEqual(viewportHeight)
    // The plane is deliberately taller than the fold — that is what removes the empty band beneath it.
    expect(plane.bottom).toBeGreaterThan(viewportHeight)
  })

  for (const height of [900, 1080] as const) {
    test(`keeps the accepted composition at 1440x${height}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height })
      await settleHero(page)
      await expect(page.locator('[data-testid="hero-recent-panel"]')).toHaveCSS('opacity', '1')

      const expected = SNAPSHOT_DESKTOP[height]
      for (const [part, testId] of [
        ['panel', 'hero-recent-panel'],
        ['plane', 'hero-preview'],
        ['cta', 'landing-primary-cta'],
      ] as const) {
        const actual = await rectOf(page, testId)
        for (const [key, value] of Object.entries(expected[part]) as [keyof typeof actual, number][]) {
          expect(
            Math.abs(actual[key as keyof typeof actual] - value),
            `${part}.${key} drifted from the accepted baseline (${value} → ${actual[key as keyof typeof actual]})`,
          ).toBeLessThanOrEqual(1)
        }
      }
    })
  }

  test('keeps the desktop pieces on their original animations', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await settleHero(page)

    const names = await page.evaluate(() => {
      const n = (sel: string) => getComputedStyle(document.querySelector(sel) as HTMLElement).animationName
      return {
        unit: n('.beat-unit'),
        window1: n('[data-testid="hero-preview"]'),
        // The panel has had a desktop entrance since long before this round; it stays.
        window2: n('[data-testid="hero-recent-panel"]'),
      }
    })
    expect(names).toEqual({ unit: 'none', window1: 'none', window2: 'hero-fade-rise' })
  })
})

test.describe('landing phone motion', () => {
  test('reads as a normal document on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await page.locator('h1').waitFor()

    const h1 = await selectorRect(page, 'h1')
    const cta = await rectOf(page, 'landing-primary-cta')
    const secondBeat = await rectOf(page, 'landing-beat-activity')
    const viewport = await page.evaluate(() => ({
      h: window.innerHeight,
      overflow: document.documentElement.scrollWidth - window.innerWidth,
    }))

    // The first screen carries the pitch; the demo windows are their own steps below it.
    expect(h1.top).toBeGreaterThanOrEqual(0)
    expect(h1.bottom).toBeLessThanOrEqual(viewport.h)
    expect(cta.bottom).toBeLessThanOrEqual(viewport.h)
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.9))
    await expect
      .poll(async () => (await rectOf(page, 'hero-preview')).top, { message: 'the demo window never arrived' })
      .toBeLessThan(viewport.h)

    // The beats stack in flow rather than sitting side by side.
    expect(secondBeat.left).toBe(0)
    expect(secondBeat.top).toBeGreaterThan(h1.bottom)
    expect(viewport.overflow).toBeLessThanOrEqual(0)
  })

  test('starts the phone intro under the header, not centred in the screen', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await page.locator('h1').waitFor()

    const m = await page.evaluate(() => {
      const h1 = document.querySelector('h1') as HTMLElement
      const header = (document.querySelector('header') as HTMLElement).getBoundingClientRect()
      const peek = document.querySelector('[data-testid="hero-preview"]') as HTMLElement
      return {
        gap: h1.getBoundingClientRect().top - header.bottom,
        peekTop: peek.getBoundingClientRect().top,
        peekOpacity: Number(getComputedStyle(peek).opacity),
        viewport: window.innerHeight,
      }
    })

    // Regression guard: the intro briefly carried `justify-content: center` inside a one-screen box,
    // which pushed the headline 96–184px down and left the top of the screen empty.
    expect(m.gap, 'empty band above the headline').toBeLessThanOrEqual(72)
    // The next window peeks over the fold, already part-way in — the first screen reads as one composition.
    expect(m.peekTop).toBeLessThan(m.viewport)
    expect(m.peekOpacity).toBeGreaterThan(0.05)
    expect(m.peekOpacity).toBeLessThan(0.95)
  })

  test('stays readable with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 1440, height: 900 })
    await settleHero(page)

    await expect
      .poll(async () => page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length), {
        message: 'an animation kept running under reduced motion',
      })
      .toBe(0)

    const motion = await page.evaluate(() => {
      const n = (sel: string) => getComputedStyle(document.querySelector(sel) as HTMLElement).animationName
      return {
        stage: n('.stage-pin'),
        beat: n('[data-testid="landing-beat-hero"]'),
        intro: n('.hero-copy'),
        unit: n('.beat-unit'),
        beatPosition: getComputedStyle(document.querySelector('[data-testid="landing-beat-hero"]') as HTMLElement)
          .position,
      }
    })
    expect([motion.stage, motion.beat, motion.intro, motion.unit]).toEqual(['none', 'none', 'none', 'none'])
    expect(motion.beatPosition).toBe('static')
  })

  test('never lets a phone piece appear or vanish abruptly', async ({ page }) => {
    // The rule that survived several rounds: nothing pops in or pops out. Every piece fades over a few
    // hundred pixels, whatever its height, and is at full strength through the middle of its passage.
    await page.setViewportSize(VIEWPORT_PHONE)
    await page.goto('/')
    await page.locator('h1').waitFor()

    const PIECES = [
      ['window 1', '[data-testid="hero-preview"]'],
      ['window 2', '[data-testid="hero-recent-panel"]'],
      ['year + ladders', '.beat-unit'],
    ] as const
    const viewport = VIEWPORT_PHONE.height
    const max = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)

    const trace = new Map<string, { top: number; opacity: number; height: number }[]>()
    for (let step = 0; step <= 80; step += 1) {
      await page.evaluate((y) => window.scrollTo(0, y), Math.round((max * step) / 80))
      await settleFrame(page)
      const rows = await page.evaluate(
        (selectors: string[]) => {
          const out: { index: number; i: number; opacity: number; top: number; height: number }[] = []
          selectors.forEach((sel, index) => {
            for (const [i, node] of [...document.querySelectorAll(sel)].entries()) {
              const el = node as HTMLElement
              const b = el.getBoundingClientRect()
              out.push({ index, i, opacity: Number(getComputedStyle(el).opacity), top: b.top, height: b.height })
            }
          })
          return out
        },
        PIECES.map(([, sel]) => sel),
      )
      for (const row of rows) {
        const key = `${row.index}:${row.i}`
        const list = trace.get(key) ?? []
        list.push({ top: row.top, opacity: row.opacity, height: row.height })
        trace.set(key, list)
      }
    }

    const problems: string[] = []
    for (const [key, points] of trace) {
      const label = PIECES[Number(key.split(':')[0])]![0]
      const height = points[0]!.height
      for (let i = 1; i < points.length; i += 1) {
        const dy = Math.abs(points[i]!.top - points[i - 1]!.top)
        const dop = Math.abs(points[i]!.opacity - points[i - 1]!.opacity)
        if (dy > 20 && dop / (dy / 100) > 0.35)
          problems.push(`${label} jumped ${dop.toFixed(2)} in ${Math.round(dy)}px`)
      }
      /*
       * The crisp window, derived from the range each piece actually uses:
       * - the windows fade over `cover 0–30%` / `cover 65–100%`, so they are at full strength while their
       *   top sits between `viewport − 0.65 × (h + viewport)` and `viewport − 0.30 × (h + viewport)`;
       * - the year block is taller than a screen and is anchored to its own `entry 0–45%` / `exit 55–100%`,
       *   so its window is between `−0.55 × h` and `viewport − 0.45 × h`.
       */
      const cover = height + viewport
      const anchored = height > viewport
      const crispLower = anchored ? -height * 0.55 : viewport - cover * 0.65
      const crispUpper = anchored ? viewport - height * 0.45 : viewport - cover * 0.3
      for (const point of points) {
        if (point.top <= crispUpper && point.top >= crispLower && point.opacity < 0.95) {
          problems.push(
            `${label} was only ${point.opacity.toFixed(2)} at top=${Math.round(point.top)} (its crisp band ${Math.round(crispLower)}…${Math.round(crispUpper)})`,
          )
        }
      }
    }
    expect(problems, problems.slice(0, 6).join(' · ')).toEqual([])
  })

  test('gives every phone piece a full arrival-hold-exit passage', async ({ page }) => {
    await page.setViewportSize(VIEWPORT_PHONE)
    await page.goto('/')
    await page.locator('h1').waitFor()

    const PIECES = [
      ['intro', '.hero-copy'],
      ['window 1', '[data-testid="hero-preview"]'],
      ['window 2', '[data-testid="hero-recent-panel"]'],
      ['year + ladders', '.beat-unit'],
    ] as const

    const peak = new Map<string, number>()
    /** Lowest opacity seen *after* a piece had scrolled off the top — must reach 0 by the end. */
    const leftOver = new Map<string, number>()
    let overflow = 0

    for (let step = 0; step <= 10; step += 1) {
      await page.evaluate((f) => {
        const max = document.documentElement.scrollHeight - window.innerHeight
        window.scrollTo(0, Math.round(max * f))
      }, step / 10)
      await settleFrame(page)
      overflow = Math.max(overflow, await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth))

      const rows = await page.evaluate(
        (selectors: string[]) => {
          const out: { label: string; opacity: number; bottom: number }[] = []
          selectors.forEach((sel, index) => {
            for (const [i, node] of [...document.querySelectorAll(sel)].entries()) {
              const el = node as HTMLElement
              out.push({
                label: `${index}:${i}`,
                opacity: Number(getComputedStyle(el).opacity),
                bottom: el.getBoundingClientRect().bottom,
              })
            }
          })
          return out
        },
        PIECES.map(([, sel]) => sel),
      )

      for (const row of rows) {
        peak.set(row.label, Math.max(peak.get(row.label) ?? 0, row.opacity))
        // A scroll animation's tail finishes after the piece has left the screen — invisible and harmless.
        if (row.bottom < 0) leftOver.set(row.label, Math.min(leftOver.get(row.label) ?? 1, row.opacity))
      }
    }

    for (const [label, value] of peak) {
      const index = Number(label.split(':')[0])
      expect(value, `${PIECES[index]![0]} (${label}) never became fully readable`).toBeGreaterThanOrEqual(0.95)
    }
    for (const [label, value] of leftOver) {
      const index = Number(label.split(':')[0])
      expect(
        value,
        `${PIECES[index]![0]} (${label}) never dissolved after leaving the screen (min ${value.toFixed(2)})`,
      ).toBeLessThanOrEqual(0.05)
    }
    expect(leftOver.size, 'no piece was ever observed leaving the screen').toBeGreaterThan(0)
    expect(overflow).toBeLessThanOrEqual(0)
  })

  test('leaves the intro as one block while the windows arrive one after another', async ({ page }) => {
    await page.setViewportSize(VIEWPORT_PHONE)
    await page.goto('/')
    await page.locator('h1').waitFor()

    // Leaving: the intro goes as one block. Per-piece exit ranges are offset by position and tore it apart.
    let witnessed = false
    for (const at of [0.2, 0.3, 0.4]) {
      await page.evaluate((n) => window.scrollTo(0, window.innerHeight * n), at)
      await settleFrame(page)
      const block = await page.evaluate(() => {
        const el = document.querySelector('.hero-copy') as HTMLElement
        return {
          opacity: Number(getComputedStyle(el).opacity),
          childrenCarryingExit: [...el.children]
            .map((c) => getComputedStyle(c).animationName)
            .filter((n) => n.includes('phone-copy-leave')),
        }
      })
      if (block.opacity > 0.05 && block.opacity < 0.95) {
        expect(block.childrenCarryingExit, 'the intro must leave as one block, not piece by piece').toEqual([])
        witnessed = true
        break
      }
    }
    expect(witnessed, 'no scroll offset caught the intro mid-exit').toBe(true)

    // Arriving: the two demo windows are separate steps — the first is well ahead of the second.
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 2))
    await expect
      .poll(
        async () => {
          const [a, b] = await page.evaluate(() => [
            Number(getComputedStyle(document.querySelector('[data-testid="hero-preview"]') as HTMLElement).opacity),
            Number(
              getComputedStyle(document.querySelector('[data-testid="hero-recent-panel"]') as HTMLElement).opacity,
            ),
          ])
          return a > 0.3 && b < a - 0.2
        },
        { message: 'the two demo windows arrived together' },
      )
      .toBe(true)
  })

  test('keeps the headline clear of the header on a short desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 800 })
    await settleHero(page)

    const h1 = await selectorRect(page, 'h1')
    const header = await page.evaluate(
      () => (document.querySelector('header') as HTMLElement).getBoundingClientRect().bottom,
    )
    const viewportHeight = await page.evaluate(() => window.innerHeight)
    const cta = await rectOf(page, 'landing-primary-cta')
    const plane = await rectOf(page, 'hero-preview')

    expect(h1.top - header).toBeGreaterThanOrEqual(8)
    expect(h1.bottom).toBeLessThanOrEqual(viewportHeight)
    expect(cta.bottom).toBeLessThanOrEqual(viewportHeight)
    expect(plane.top).toBeLessThan(viewportHeight)
  })
})
