import { expect, test, type Locator } from '@playwright/test'
import { mockAuthApis } from '../utils/auth-helpers.js'

/**
 * The three showcase panels have one visible contract: **flat and visible at rest, lit under the
 * pointer**. The panels are currently built with `tilt: false`, so "flat" means no transform at all.
 *
 * This is an e2e test because the contract broke twice in CSS/JS and no unit test could see it:
 *
 *  - `animation-fill-mode: forwards` held an identity `transform` over the panels forever, so any
 *    transform written inline never rendered;
 *  - after the fill was changed to `backwards`, an `opacity: 0` baseline took over once the entrance
 *    finished and the cards vanished one by one.
 */

/**
 * What "at rest" computes to, per panel.
 *
 * The dashboard runs with `tilt: true` and therefore carries an identity transform at rest (the
 * composable writes translateZ(0) rotate*(0) scale(1)); the two cards below it still run with
 * `tilt: false`, which writes no transform at all.
 */
const RESTING = ['matrix(1, 0, 0, 1, 0, 0)', 'none']
/** The dashboard inlines `perspective(1200px)`, so its resting matrix carries the perspective term
 *  (-1/1200) and no rotation or scale. */
const isResting = (v: string): boolean =>
  RESTING.includes(v) || /^matrix3d\(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, -0\.000833333, 0, 0, 0, 1\)$/.test(v)

/**
 * Wait for a panel's CSS transitions to finish instead of sleeping a fixed number of milliseconds.
 */
async function settle(panel: Locator): Promise<void> {
  await panel.evaluate(async (el: Element) => {
    const running = el.getAnimations().filter((a: Animation) => a.playState === 'running')
    await Promise.all(running.map((a: Animation) => a.finished.catch(() => undefined)))
  })
}

test.describe('Auth showcase panels', () => {
  test('stay visible and flat after the entrance, then lift and light up under the pointer', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 }) // the panels hide below the lg breakpoint
    await mockAuthApis(page)
    await page.goto('/auth/login')

    const panels = page.locator('.auth-dashboard, .auth-card-3d')
    await expect(panels).toHaveCount(3)
    await Promise.all((await panels.all()).map(settle)) // entrance is 1s plus up to 0.3s of per-card delay

    for (const [index, panel] of (await panels.all()).entries()) {
      const state = await panel.evaluate((el: Element) => {
        const rect = el.getBoundingClientRect()
        const cs = getComputedStyle(el)
        return {
          opacity: cs.opacity,
          transform: cs.transform,
          height: Math.round(rect.height),
          layout: el instanceof HTMLElement ? el.offsetHeight : 0,
        }
      })
      expect(state.opacity, `panel ${index} is not visible`).toBe('1')
      expect(isResting(state.transform), `panel ${index} is not flat at rest (got ${state.transform})`).toBe(true)
      expect(state.height, `panel ${index} is not laid out`).toBe(state.layout)
    }

    // Every panel answers the pointer on its own: the glare lights up and the hover shadow differs
    // from the resting one. The panel lifts while the pointer is on it.
    for (const [index, panel] of (await panels.all()).entries()) {
      await page.mouse.move(8, 8)
      // Poll instead of sampling once: the transform transition may not have started yet when
      // `settle()` looks, and a single read would catch the previous panel's lifted matrix.
      await expect
        .poll(async () => isResting(await panel.evaluate((el: Element) => getComputedStyle(el).transform)), {
          message: `panel ${index} did not return to rest before its turn`,
        })
        .toBe(true)

      const box = await panel.boundingBox()
      expect(box, `panel ${index} has no box`).not.toBeNull()
      await page.mouse.move(box!.x + box!.width * 0.3, box!.y + box!.height * 0.3)
      await settle(panel)

      const state = await panel.evaluate((el: Element) => {
        const sheen = el.querySelector('.auth-dashboard__sheen, .auth-card-3d__sheen')
        return {
          transform: getComputedStyle(el).transform,
          inline: el instanceof HTMLElement ? el.style.transform : 'x',
          tilting: el.classList.contains('is-tilting'),
          sheen: sheen ? getComputedStyle(sheen).opacity : '0',
        }
      })
      // Poll: the glare fades in over 0.3s, so a single read can catch it mid-transition (0.95x).
      await expect
        .poll(
          async () =>
            await panel.evaluate((el: Element) => {
              const sheen = el.querySelector('.auth-dashboard__sheen, .auth-card-3d__sheen')
              return sheen ? getComputedStyle(sheen).opacity : '0'
            }),
          { message: `panel ${index} glare is not lit` },
        )
        .toBe('1')
      expect(state.tilting, `panel ${index} never entered the tilting state`).toBe(true)
      // No inline transform at all — not even an identity one, which would open a stacking context.
      // Only the dashboard runs with the tilt on; the two cards below it stay still by design.
      if (state.tilting && state.inline) {
        // The lift is integrated per frame now, so a single read can catch it mid-climb (~1.025).
        await expect
          .poll(
            async () => await panel.evaluate((el: Element) => (el instanceof HTMLElement ? el.style.transform : '')),
            { message: `panel ${index} never finished lifting` },
          )
          .toContain('scale(1.03)')
      } else {
        expect(state.inline, `panel ${index} wrote a transform without the tilt`).toBe('')
      }
    }

    // Leaving puts every panel back to its resting pose, animated by the CSS transition.
    await page.mouse.move(8, 8)
    await Promise.all((await panels.all()).map(settle))
    for (const [index, panel] of (await panels.all()).entries()) {
      const settled = await panel.evaluate((el: Element) => getComputedStyle(el).transform)
      expect(isResting(settled), `panel ${index} did not settle back (got ${settled})`).toBe(true)
    }
  })
})
