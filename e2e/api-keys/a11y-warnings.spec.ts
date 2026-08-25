import { test, expect } from '@playwright/test'
import type { ConsoleMessage } from '@playwright/test'
import { setupApiKeysPage, openCreateDialog, submitCreateForm, copyRawKey } from './helpers.js'

/**
 * Collects reka-ui a11y console warnings. Module-level so the test body and its
 * closure contain no conditionals (playwright no-conditional-in-test rule).
 * The returned array accumulates matches until it is removed via page.off.
 */
function collectRekaA11yWarnings(warnings: string[]): (msg: ConsoleMessage) => void {
  return (msg: ConsoleMessage) => {
    if (msg.type() === 'warning' && msg.text().includes('DialogContent')) {
      warnings.push(msg.text())
    }
  }
}

test.describe('API key create flow a11y', () => {
  test('does not emit reka-ui a11y warnings and wires the alertdialog aria correctly', async ({ page }) => {
    const warnings: string[] = []
    const onConsoleWarning = collectRekaA11yWarnings(warnings)
    page.on('console', onConsoleWarning)

    await setupApiKeysPage(page, [])
    await openCreateDialog(page)
    await submitCreateForm(page, 'Repro Key')

    const dialog = page.getByRole('alertdialog')
    await expect(dialog).toBeVisible()

    // reka-ui wires content aria-labelledby/aria-describedby to the title and
    // description elements it renders; both must resolve to existing ids.
    const aria = await dialog.evaluate((el) => {
      const result: { labelledBy: string; describedBy: string } = {
        labelledBy: el.getAttribute('aria-labelledby') ?? '',
        describedBy: el.getAttribute('aria-describedby') ?? '',
      }
      return result
    })
    expect(aria.labelledBy).not.toBe('')
    expect(aria.describedBy).not.toBe('')
    await expect(page.locator(`#${aria.labelledBy}`)).toHaveCount(1)
    await expect(page.locator(`#${aria.describedBy}`)).toHaveCount(1)

    await copyRawKey(page)
    await dialog.getByRole('button', { name: 'Copied, close' }).click()
    await expect(page.getByRole('alertdialog')).toHaveCount(0)
    await expect(page.getByRole('dialog')).toHaveCount(0)

    // Second flow exercises the remount path again.
    await openCreateDialog(page)
    await submitCreateForm(page, 'Repro Key 2')
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await expect(page.getByRole('alertdialog')).toHaveCount(1)

    page.off('console', onConsoleWarning)
    expect(warnings).toEqual([])
  })
})
