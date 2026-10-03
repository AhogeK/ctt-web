import { test, expect, type Page } from '@playwright/test'
import { SNAPSHOT_DESKTOP } from './composition-snapshot.js'

/**
 * Composition checks for the landing page.
 *
 * Two families live here. The first four pin the accepted **desktop** composition (rectangles,
 * both themes agreeing, the fold, and the recorded baseline): they exist because relationship checks
 * alone cannot prove that both themes did not drift *together*.
 *
 * The rest cover the **phone** motion. The phone keeps every block in normal flow (nothing pinned) and
 * gives each *region* — the intro, each demo window, the year-and-ladders block — a fade-in, a hold and a
 * fade-out, all driven by the visitor's own scrolling. The rules: every one of those pieces must fade
 * gradually (no popping in or out), stay at full strength through the middle of its passage, and leave
 * as the unit it is read as.
 */
const VIEWPORT_PHONE = { width: 440, height: 956 }

/** Waits for the hero's entrance to finish. The session panel is animated on phones, so it is not used
 *  as a signal that the page has loaded. */
async function settleHero(page: Page) {
  await page.goto('/')
  await expect(page.locator('[data-testid="hero-preview"]').locator('..')).toHaveCSS('opacity', '1')
}

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
        // The panel has its own desktop entrance; it stays.
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
    // The next window peeks over the fold, so the first screen reads as one composition. Its opacity is
    // only checked for "not nothing": the fade is a fixed clock now, and a piece that entered while the
    // visitor was already looking legitimately sits at full strength.
    expect(m.peekTop).toBeLessThan(m.viewport)
    expect(m.peekOpacity).toBeGreaterThan(0.05)
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

  test('fades every phone piece on a clock a fast scroll cannot outrun', async ({ page }) => {
    // The rule that survived several rounds: nothing pops in or pops out. The mechanism changed, though:
    // a fade ranged over scroll distance is crossed by however far a gesture travels — measured before
    // this change, one 1000px gesture took the intro from opacity 1 to 0 and left the next block fully
    // opaque, with no intermediate frame sampled. Each piece now runs a fixed 600ms transition between
    // states, so the fade is seen whatever the gesture does.
    await page.setViewportSize(VIEWPORT_PHONE)
    await page.goto('/')
    await page.locator('h1').waitFor()

    const PIECES = [
      ['window 1', '[data-testid="hero-preview"]'],
      ['window 2', '[data-testid="hero-recent-panel"]'],
      ['year + ladders', '.beat-unit'],
    ] as const

    for (const [label, sel] of PIECES) {
      // `transitionDuration` is a per-property list — one entry per animated property.
      const duration = await page.evaluate(
        (s) => getComputedStyle(document.querySelector(s) as HTMLElement).transitionDuration,
        sel,
      )
      const durations = duration.split(',').map((value) => value.trim())
      expect(durations.length, `${label} declares no transition`).toBeGreaterThan(0)
      expect(
        durations.every((value) => value === '0.6s'),
        `${label} does not fade on a fixed clock (${duration})`,
      ).toBe(true)
    }

    // Let the first observation pass settle: each piece gets its state on mount, and the jump must be
    // what moves them — jumping before the first callback leaves nothing to animate.
    await expect
      .poll(
        async () =>
          page.evaluate(
            (sels: string[]) => sels.every((s) => document.querySelector(s)?.hasAttribute('data-reveal-state')),
            PIECES.map(([, s]) => s),
          ),
        { message: 'the pieces never received their first state' },
      )
      .toBe(true)

    // Let the first pass *finish*: a piece below the fold starts visible (no state yet) and fades to its
    // hidden state once the observer reports, so a jump taken during that fade would only ever see its
    // tail. Waiting for the settled value keeps the check about the jump, not about the first paint.
    await expect
      .poll(
        async () =>
          page.evaluate(
            (s) => Number(getComputedStyle(document.querySelector(s) as HTMLElement).opacity),
            '[data-testid="hero-recent-panel"]',
          ),
        { message: 'the first observation pass never settled' },
      )
      .toBeLessThanOrEqual(0.05)

    // Behaviour: a fast jump must leave at least one piece mid-fade. Sampled inside the page — a
    // round-trip per sample can be slower than the 600ms fade itself, which is what made the first
    // version of this check flaky.
    const samples = await page.evaluate(
      async (sels: string[]) => {
        window.scrollTo(0, window.innerHeight * 1.2)
        const read = () => sels.map((s) => Number(getComputedStyle(document.querySelector(s) as HTMLElement).opacity))
        const rows: number[][] = [read()]
        const started = performance.now()
        while (performance.now() - started < 900) {
          await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))
          rows.push(read())
        }
        return rows
      },
      PIECES.map(([, s]) => s),
    )
    const sawIntermediate = samples.some((row) => row.some((o) => o > 0.05 && o < 0.95))
    expect(sawIntermediate, 'a fast scroll crossed every piece without one intermediate frame').toBe(true)

    // And a piece that is on screen settles fully readable.
    await expect
      .poll(
        async () =>
          page.evaluate(
            (s) => Number(getComputedStyle(document.querySelector(s) as HTMLElement).opacity),
            PIECES[0][1],
          ),
        { message: 'window 1 never became readable' },
      )
      .toBeGreaterThan(0.95)
  })

  test('gives every phone piece arrival, hold and dissolve as states', async ({ page }) => {
    await page.setViewportSize(VIEWPORT_PHONE)
    await page.goto('/')
    await page.locator('h1').waitFor()

    const PIECES = [
      ['intro', '.hero-copy'],
      ['window 1', '[data-testid="hero-preview"]'],
      ['window 2', '[data-testid="hero-recent-panel"]'],
      ['year + ladders', '.beat-unit'],
    ] as const

    let overflow = 0
    for (const [label, sel] of PIECES) {
      await page.evaluate((s) => (document.querySelector(s) as HTMLElement).scrollIntoView({ block: 'center' }), sel)
      await expect
        .poll(
          async () =>
            page.evaluate((s) => (document.querySelector(s) as HTMLElement).getAttribute('data-reveal-state'), sel),
          { message: `${label} never entered` },
        )
        .toBe('in')
      await expect
        .poll(
          async () =>
            page.evaluate((s) => Number(getComputedStyle(document.querySelector(s) as HTMLElement).opacity), sel),
          { message: `${label} never became readable` },
        )
        .toBeGreaterThan(0.95)
      overflow = Math.max(overflow, await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth))
    }

    // Leaving: the intro is far above the fold at the bottom of the page, so it must be dissolved.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await expect
      .poll(
        async () =>
          page.evaluate(() => (document.querySelector('.hero-copy') as HTMLElement).getAttribute('data-reveal-state')),
        { message: 'the intro never left upward' },
      )
      .toBe('above')
    await expect
      .poll(
        async () =>
          page.evaluate(() => Number(getComputedStyle(document.querySelector('.hero-copy') as HTMLElement).opacity)),
        { message: 'the intro never dissolved after leaving' },
      )
      .toBeLessThanOrEqual(0.05)

    expect(overflow).toBeLessThanOrEqual(0)
  })

  test('keeps the intro as one block and the windows as separate steps', async ({ page }) => {
    await page.setViewportSize(VIEWPORT_PHONE)
    await page.goto('/')
    await page.locator('h1').waitFor()

    // One block: the intro carries the state itself and hands none to its children, so it cannot tear
    // apart the way per-piece ranges did.
    const intro = await page.evaluate(() => {
      const el = document.querySelector('.hero-copy') as HTMLElement
      return {
        own: el.hasAttribute('data-reveal-state'),
        children: [...el.children].filter((child) => child.hasAttribute('data-reveal-state')).length,
      }
    })
    expect(intro.own, 'the intro must fade as one block').toBe(true)
    expect(intro.children, 'the intro must fade as one block, not piece by piece').toBe(0)

    // Separate steps: bring the first window *just* over the fold — the second is far below and must
    // still be waiting. Centring the first window was too far down the page: at 375px the two windows
    // are close enough that both enter together, which is not what the stagger is about.
    await page.evaluate(() => {
      const first = document.querySelector('[data-testid="hero-preview"]') as HTMLElement
      const top = first.getBoundingClientRect().top + window.scrollY
      window.scrollTo(0, top - window.innerHeight + 60)
    })
    await expect
      .poll(
        async () =>
          page.evaluate(() => {
            const state = (s: string) => (document.querySelector(s) as HTMLElement).getAttribute('data-reveal-state')
            return [state('[data-testid="hero-preview"]'), state('[data-testid="hero-recent-panel"]')]
          }),
        { message: 'the two demo windows are not separate steps' },
      )
      .toEqual(['in', 'below'])
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
