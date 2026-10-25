import { test, expect } from '@playwright/test'
import { mockAuthApis, loginViaForm, okEnvelope } from '../utils/auth-helpers.js'

/**
 * The settings group's navigation contract:
 *
 *  1. /settings lands on its default section (Profile) — the parent record
 *     redirects, so the content region never renders blank.
 *  2. The section rail reaches every settings page and marks the active one.
 *  3. The legacy /devices URL redirects into the group.
 *  4. The avatar menu opens the group on its default section (it used to point
 *     at API Keys; this is the reported mismatch).
 */
test.describe('Settings navigation', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthApis(page)
    // The Devices section fetches the registry; an empty list is enough for
    // the heading and the rail assertions.
    await page.route('**/api/v1/devices', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(okEnvelope([])) })
      } else {
        await route.fallback()
      }
    })
    await loginViaForm(page)
  })

  test('/settings lands on the default section (Profile)', async ({ page }) => {
    await page.goto('/settings')

    await expect(page).toHaveURL(/\/settings\/profile$/)
    await expect(page.getByRole('heading', { name: 'Profile Settings' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Settings sections' })).toBeVisible()
  })

  test('the section rail reaches every settings page', async ({ page }) => {
    await page.goto('/settings/profile')
    const rail = page.getByRole('navigation', { name: 'Settings sections' })

    await rail.getByRole('link', { name: /Devices/ }).click()
    await expect(page).toHaveURL(/\/settings\/devices$/)
    await expect(page.getByRole('heading', { name: 'Device Management' })).toBeVisible()

    await rail.getByRole('link', { name: /Preferences/ }).click()
    await expect(page).toHaveURL(/\/settings\/preferences$/)
    await expect(page.getByRole('heading', { name: 'Preferences' })).toBeVisible()

    await rail.getByRole('link', { name: /API Keys/ }).click()
    await expect(page).toHaveURL(/\/settings\/api-keys$/)
    await expect(page.getByRole('heading', { name: 'API Keys' })).toBeVisible()

    await rail.getByRole('link', { name: /Profile/ }).click()
    await expect(page).toHaveURL(/\/settings\/profile$/)
  })

  test('the legacy /devices URL redirects into the settings group', async ({ page }) => {
    await page.goto('/devices')

    await expect(page).toHaveURL(/\/settings\/devices$/)
    await expect(page.getByRole('heading', { name: 'Device Management' })).toBeVisible()
  })

  test('keeps sidebar text above AA contrast in the light theme', async ({ page }) => {
    await page.goto('/settings/profile')
    await expect(page.getByRole('heading', { name: 'Profile Settings' })).toBeVisible()

    const samples = await page.evaluate(() => {
      const ctx = document.createElement('canvas').getContext('2d')
      if (!ctx) throw new Error('2d canvas unavailable')

      const read = (value: string) => {
        ctx.clearRect(0, 0, 1, 1)
        ctx.fillStyle = value
        ctx.fillRect(0, 0, 1, 1)
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
        return { r, g, b, a: a / 255 }
      }

      const backgroundOf = (element: Element) => {
        let node: Element | null = element
        while (node) {
          const background = read(getComputedStyle(node).backgroundColor)
          if (background.a > 0) return background
          node = node.parentElement
        }
        return { r: 255, g: 255, b: 255, a: 1 }
      }

      const luminance = (color: { r: number; g: number; b: number }) => {
        const channel = (value: number) => {
          const c = value / 255
          return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
        }
        return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b)
      }

      const contrast = (
        foreground: { r: number; g: number; b: number },
        background: { r: number; g: number; b: number },
      ) => {
        const a = luminance(foreground)
        const b = luminance(background)
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
      }

      const sample = (name: string, element: Element | null) => {
        if (!element) throw new Error(`missing element: ${name}`)
        const foreground = read(getComputedStyle(element).color)
        const background = backgroundOf(element)
        const composited = {
          r: foreground.r * foreground.a + background.r * (1 - foreground.a),
          g: foreground.g * foreground.a + background.g * (1 - foreground.a),
          b: foreground.b * foreground.a + background.b * (1 - foreground.a),
        }
        return {
          name,
          color: getComputedStyle(element).color,
          background: `rgb(${Math.round(background.r)}, ${Math.round(background.g)}, ${Math.round(background.b)})`,
          ratio: Math.round(contrast(composited, background) * 100) / 100,
        }
      }

      const rail = document.querySelector('nav[aria-label="Settings sections"]')
      if (!rail) throw new Error('settings rail missing')
      const links = [...rail.querySelectorAll('a')]
      const selected = links.find((link) => link.getAttribute('aria-current') === 'page')
      const unselected = links.find((link) => link.getAttribute('aria-current') !== 'page')
      const selectedSpans = selected ? [...selected.querySelectorAll('span')] : []
      const unselectedSpans = unselected ? [...unselected.querySelectorAll('span')] : []

      return [
        sample('settings selected label', selectedSpans[0] ?? null),
        sample('settings selected description', selectedSpans[1] ?? null),
        sample('settings unselected label', unselectedSpans[0] ?? null),
        sample('settings unselected description', unselectedSpans[1] ?? null),
        ...[...document.querySelectorAll('[data-sidebar="group-label"]')].map((label) =>
          sample(`sidebar group label: ${label.textContent?.trim() ?? ''}`, label),
        ),
        sample(
          'sidebar active settings label',
          document.querySelector('[data-slot="sidebar"] a[href="/settings"] span'),
        ),
      ]
    })

    const failures = samples
      .filter((item) => item.ratio < 4.5)
      .map((item) => `${item.name} is ${item.ratio}:1 (${item.color} on ${item.background})`)
    expect(failures).toEqual([])
  })

  test('the avatar menu opens the settings group on its default section', async ({ page }) => {
    // Start on a different section so the assertion proves the target rather
    // than an already-correct URL.
    await page.goto('/settings/api-keys')
    await expect(page.getByRole('heading', { name: 'API Keys' })).toBeVisible()

    await page.getByRole('button', { name: 'Open user menu' }).click()
    await page.getByRole('menuitem', { name: /Settings/ }).click()

    await expect(page).toHaveURL(/\/settings\/profile$/)
    await expect(page.getByRole('heading', { name: 'Profile Settings' })).toBeVisible()
  })
})
