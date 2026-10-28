import { test, expect, type Page } from '@playwright/test'

/**
 * Interface language on the public surfaces.
 *
 * A visitor has no avatar menu, so the marketing top bar and the auth card carry their
 * own language menu. This spec proves the trigger names the active language (the state
 * is readable without opening it), that the menu switches the whole shell without a
 * reload, that the choice survives the navigation between the two public pages, and that
 * **the skeleton does not depend on the text**: control boxes keep their geometry when
 * the language changes, while text-driven widths (the CTA label) only change where the
 * design allows it.
 */
/** The part of a box that must not move when the language changes. */
const sizeOf = (r: { w: number; h: number; top: number } | null) => (r ? { w: r.w, h: r.h } : null)

test.describe('Interface language — public surfaces', () => {
  test('the landing page and the login page carry their own language menu', async ({ page }) => {
    await page.goto('/')

    const trigger = page.getByTestId('language-menu')
    await expect(trigger).toBeVisible()
    await expect(page.getByTestId('language-current')).toHaveText('EN')
    await expect(page.getByTestId('marketing-cta')).toHaveText('Sign in')

    await trigger.click()
    await page.getByRole('menuitemradio', { name: '简体中文' }).click()

    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')
    // The top bar repaints from the same instance the menu publishes to.
    await expect(page.getByTestId('marketing-cta')).toHaveText('登录')
    await expect(page.getByTestId('language-current')).toHaveText('中')

    // The auth card carries the same control, and the choice travelled with the URL change.
    await page.goto('/auth/login')
    await expect(page.getByTestId('language-current')).toHaveText('中')
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')

    await page.getByTestId('language-menu').click()
    await page.getByRole('menuitemradio', { name: 'English' }).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')

    // Restore the default so a later spec in the same context starts in English.
    await page.goto('/')
    await expect(page.getByTestId('marketing-cta')).toHaveText('Sign in')
  })

  test('the skeleton keeps its geometry when the language changes', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })

    const boxes = (target: Page) =>
      target.evaluate(() => {
        const rect = (selector: string): { w: number; h: number; top: number } | null => {
          const el = document.querySelector(selector)
          if (!el) return null
          const r = el.getBoundingClientRect()
          return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top) }
        }
        return {
          language: rect('[data-testid="language-menu"]'),
          theme: rect('header [data-testid="theme-toggle"]'),
          cta: rect('[data-testid="marketing-cta"]'),
          card: rect('.auth-card'),
        }
      })

    await page.goto('/')
    await expect(page.getByTestId('language-menu')).toBeVisible()
    const english = await boxes(page)

    await page.getByTestId('language-menu').click()
    await page.getByRole('menuitemradio', { name: '简体中文' }).click()
    await expect(page.getByTestId('language-current')).toHaveText('中')
    const chinese = await boxes(page)

    // Fixed boxes: identical in both languages, down to the pixel.
    expect(chinese.language).toEqual(english.language)
    expect(chinese.theme).toEqual(english.theme)
    // Text-driven width: the height is the skeleton and must not move.
    expect(chinese.cta).toEqual(english.cta)

    // The auth card: inputs and the submit button are full-width skeletons, so every
    // dimension stays put even though the labels and the button copy translate.
    const formBoxes = (target: Page) =>
      target.evaluate(() => {
        const rect = (selector: string): { w: number; h: number; top: number } | null => {
          const el = document.querySelector(selector)
          if (!el) return null
          const r = el.getBoundingClientRect()
          return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top) }
        }
        return {
          language: rect('[data-testid="language-menu"]'),
          theme: rect('.auth-form__header [data-testid="theme-toggle"]'),
          email: rect('input[type="email"]'),
          submit: rect('form button[type="submit"]'),
        }
      })

    await page.goto('/auth/login')
    await expect(page.getByTestId('language-menu')).toBeVisible()
    const zhForm = await formBoxes(page)
    await page.getByTestId('language-menu').click()
    await page.getByRole('menuitemradio', { name: 'English' }).click()
    await expect(page.getByTestId('language-current')).toHaveText('EN')
    const enForm = await formBoxes(page)

    // Size is the skeleton: it must not move. The card is vertically centred and its
    // height is still content-driven (the English copy wraps one block taller), so the
    // vertical position of the header controls is tracked separately and not asserted
    // here — see the open item on the auth card height.
    expect(sizeOf(enForm.language)).toEqual(sizeOf(zhForm.language))
    expect(sizeOf(enForm.theme)).toEqual(sizeOf(zhForm.theme))
    expect(sizeOf(enForm.email)).toEqual(sizeOf(zhForm.email))
    expect(sizeOf(enForm.submit)).toEqual(sizeOf(zhForm.submit))
  })

  test('the tab title and the 404 page follow the interface language', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('ctt.locale', 'zh-CN'))

    // A route title resolved through the catalogue, read from the tab itself.
    await page.goto('/auth/login')
    await expect(page).toHaveTitle('登录 - Code Time Tracker')

    // The catch-all page is copy too, not just a status code.
    await page.goto('/this-route-does-not-exist')
    await expect(page).toHaveTitle('页面不存在 - Code Time Tracker')
    await expect(page.getByRole('heading', { level: 2 })).toHaveText('页面不存在')
    await expect(page.getByRole('button', { name: '回到首页' })).toBeVisible()
    await expect(page.getByRole('button', { name: '返回上一页' })).toBeVisible()

    // Switching language without navigating must rewrite the title already on screen.
    // The 404 view renders outside the shells, so use a public page that owns the menu.
    await page.goto('/auth/login')
    await expect(page).toHaveTitle('登录 - Code Time Tracker')
    await page.getByTestId('language-menu').click()
    await page.getByRole('menuitemradio', { name: 'English' }).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page).toHaveTitle('Login - Code Time Tracker')
  })
})
