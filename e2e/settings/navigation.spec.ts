import { test, expect } from '@playwright/test'
import { mockAuthApis, loginViaForm, okEnvelope } from '../utils/auth-helpers.js'

/**
 * The settings group's navigation contract:
 *
 *  1. /settings lands on its default section (Profile) — the parent record
 *     redirects, so the content region never renders blank.
 *  2. The sidebar lists every settings section, and the page itself carries no
 *     second navigation for them.
 *  3. The legacy /devices URL redirects into the group.
 *  4. The avatar menu opens the group on its default section (it used to point
 *     at API Keys; this is the reported mismatch).
 */

/** The app sidebar is the only surface that navigates between settings sections. */
const sidebar = (page: import('@playwright/test').Page) => page.locator('[data-slot="sidebar"]')

test.describe('Settings navigation', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthApis(page)
    // The Devices section fetches the registry; an empty list is enough for
    // the heading and the sidebar assertions.
    await page.route('**/api/v1/devices', async (route) => {
      await route.fulfill({ json: okEnvelope([]) })
    })
    await loginViaForm(page)
  })

  test('/settings lands on the default section (Profile)', async ({ page }) => {
    await page.goto('/settings')

    await expect(page).toHaveURL(/\/settings\/profile$/)
    await expect(page.getByRole('heading', { name: 'Profile Settings' })).toBeVisible()
    // One navigation surface: the sections are sidebar leaves, not a page rail.
    await expect(page.locator('nav[aria-label="Settings sections"]')).toHaveCount(0)
  })

  test('the sidebar reaches every settings page', async ({ page }) => {
    await page.goto('/settings/profile')
    const nav = sidebar(page)

    await nav.getByRole('link', { name: /Devices/ }).click()
    await expect(page).toHaveURL(/\/settings\/devices$/)
    await expect(page.getByRole('heading', { name: 'Device Management' })).toBeVisible()

    await nav.getByRole('link', { name: /Preferences/ }).click()
    await expect(page).toHaveURL(/\/settings\/preferences$/)
    await expect(page.getByRole('heading', { name: 'Preferences' })).toBeVisible()

    await nav.getByRole('link', { name: /API Keys/ }).click()
    await expect(page).toHaveURL(/\/settings\/api-keys$/)
    await expect(page.getByRole('heading', { name: 'API Keys' })).toBeVisible()

    await nav.getByRole('link', { name: /Security/ }).click()
    await expect(page).toHaveURL(/\/settings\/security$/)
    await expect(page.getByRole('heading', { name: 'Security', level: 1 })).toBeVisible()

    await nav.getByRole('link', { name: /Profile/ }).click()
    await expect(page).toHaveURL(/\/settings\/profile$/)
  })

  test('the devices page and the API keys page link to each other', async ({ page }) => {
    // The two pages only make sense together — a key is what the tracker signs
    // in with, a device is the tracker that signs in — so each states the
    // relation and points at the other.
    await page.goto('/settings/devices')
    const devicesNote = page.getByTestId('settings-relation-note')
    await expect(devicesNote.getByRole('link', { name: 'API Keys' })).toBeVisible()
    await devicesNote.getByRole('link', { name: 'API Keys' }).click()
    await expect(page).toHaveURL(/\/settings\/api-keys$/)

    const keysNote = page.getByTestId('settings-relation-note')
    await expect(keysNote.getByRole('link', { name: 'Devices' })).toBeVisible()
    await keysNote.getByRole('link', { name: 'Devices' }).click()
    await expect(page).toHaveURL(/\/settings\/devices$/)
  })

  test('the legacy /devices URL redirects into the settings group', async ({ page }) => {
    await page.goto('/devices')

    await expect(page).toHaveURL(/\/settings\/devices$/)
    await expect(page.getByRole('heading', { name: 'Device Management' })).toBeVisible()
  })

  test('the phone drawer reaches a section and closes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/settings/profile')

    await page.getByRole('button', { name: 'Toggle Sidebar' }).click()
    const drawer = page.getByRole('dialog')
    await drawer.getByRole('link', { name: 'Devices' }).click()

    await expect(page).toHaveURL(/\/settings\/devices$/)
    await expect(page.getByRole('heading', { name: 'Device Management' })).toBeVisible()
    await expect(page.getByRole('dialog')).toBeHidden()
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

      const active = document.querySelector('[data-slot="sidebar"] a[href="/settings/profile"] span')
      const inactive = document.querySelector('[data-slot="sidebar"] a[href="/dashboard"] span')

      return [
        sample('sidebar active section label', active),
        sample('sidebar inactive section label', inactive),
        ...[...document.querySelectorAll('[data-sidebar="group-label"]')].map((label) =>
          sample(`sidebar group label: ${label.textContent?.trim() ?? ''}`, label),
        ),
      ]
    })

    const failures = samples
      .filter((item) => item.ratio < 4.5)
      .map((item) => `${item.name} is ${item.ratio}:1 (${item.color} on ${item.background})`)
    expect(failures).toEqual([])
  })

  test('moves the sidebar highlight without a lingering fill', async ({ page }) => {
    await page.goto('/settings/profile')
    const nav = sidebar(page)
    const profile = nav.getByRole('link', { name: /Profile/ })
    const devices = nav.getByRole('link', { name: /Devices/ })

    const read = (locator: typeof profile) =>
      locator.evaluate((element) => {
        const style = getComputedStyle(element)
        const rect = element.getBoundingClientRect()
        return {
          transition: style.transitionProperty,
          width: rect.width,
          height: rect.height,
        }
      })

    const before = { profile: await read(profile), devices: await read(devices) }
    // A background that fades out is what reads as a flicker when the selection
    // moves, so the fill must never be animated.
    expect(before.profile.transition).not.toContain('background-color')
    expect(before.devices.transition).not.toContain('background-color')

    await devices.click()
    await expect(page).toHaveURL(/\/settings\/devices$/)
    await expect(profile).toHaveAttribute('data-active', 'false')
    await expect(devices).toHaveAttribute('data-active', 'true')

    const after = { profile: await read(profile), devices: await read(devices) }
    expect(Math.abs(after.profile.width - before.profile.width)).toBeLessThan(0.5)
    expect(Math.abs(after.profile.height - before.profile.height)).toBeLessThan(0.5)
    expect(Math.abs(after.devices.width - before.devices.width)).toBeLessThan(0.5)
    expect(Math.abs(after.devices.height - before.devices.height)).toBeLessThan(0.5)
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
