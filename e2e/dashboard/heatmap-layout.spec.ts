import { test, expect } from '@playwright/test'
import { mockAuthApis, loginViaForm } from '../utils/auth-helpers.js'

test('heatmap halves beside streaks at xl (1920)', async ({ page }) => {
  await mockAuthApis(page)
  await loginViaForm(page)
  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: 'Coding heatmap' })).toBeVisible()
  const heat = await page.getByRole('heading', { name: 'Coding heatmap' }).boundingBox()
  const streaks = await page.getByRole('heading', { name: 'Coding streaks' }).boundingBox()
  expect(heat).not.toBeNull()
  expect(streaks).not.toBeNull()
  // side by side: same top line
  expect(Math.abs(heat!.y - streaks!.y)).toBeLessThan(4)
})

test('heatmap spans full row when the row cannot fit both cards at 729px each', async ({ page }) => {
  await mockAuthApis(page)
  await loginViaForm(page)
  await page.setViewportSize({ width: 1500, height: 1080 })
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: 'Coding heatmap' })).toBeVisible()
  const heat = await page.getByRole('heading', { name: 'Coding heatmap' }).boundingBox()
  const streaks = await page.getByRole('heading', { name: 'Coding streaks' }).boundingBox()
  expect(heat).not.toBeNull()
  expect(streaks).not.toBeNull()
  expect(heat!.y + heat!.height).toBeLessThanOrEqual(streaks!.y + 1)
})

test('heatmap halves beside streaks when the row fits both cards', async ({ page }) => {
  await mockAuthApis(page)
  await loginViaForm(page)
  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: 'Coding heatmap' })).toBeVisible()
  // heatmap section and streaks section must NOT be side by side: heatmap bottom > streaks top
  const heat = page.getByRole('heading', { name: 'Coding heatmap' })
  const streaks = page.getByRole('heading', { name: 'Coding streaks' })
  const heatBox = await heat.boundingBox()
  const streakBox = await streaks.boundingBox()
  expect(heatBox).not.toBeNull()
  expect(streakBox).not.toBeNull()
  
  // side-by-side: same top line
  expect(Math.abs(heatBox!.y - streakBox!.y)).toBeLessThan(4)
})
