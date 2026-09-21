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

/** What a panel computes to with no transform of its own. */
const RESTING = 'none'

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
  test('stay visible and flat after the entrance, then light up under the pointer', async ({ page }) => {
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
      expect(state.transform, `panel ${index} is not flat at rest`).toBe(RESTING)
      expect(state.height, `panel ${index} is not laid out`).toBe(state.layout)
    }

    // Every panel answers the pointer on its own: the glare lights up and the hover shadow differs
    // from the resting one. With `tilt: false` the panel itself must not move.
    for (const [index, panel] of (await panels.all()).entries()) {
      await page.mouse.move(8, 8)
      await settle(panel)

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
      expect(state.sheen, `panel ${index} glare is not lit`).toBe('1')
      expect(state.tilting, `panel ${index} never entered the tilting state`).toBe(true)
      // No inline transform at all — not even an identity one, which would open a stacking context.
      expect(state.inline, `panel ${index} carries a transform while the tilt is off`).toBe('')
      expect(state.transform, `panel ${index} moved under the pointer`).toBe(RESTING)
    }

    // Leaving puts every panel back to its resting pose, animated by the CSS transition.
    await page.mouse.move(8, 8)
    await Promise.all((await panels.all()).map(settle))
    for (const [index, panel] of (await panels.all()).entries()) {
      expect(
        await panel.evaluate((el: Element) => getComputedStyle(el).transform),
        `panel ${index} did not settle back`,
      ).toBe(RESTING)
    }
  })
})
