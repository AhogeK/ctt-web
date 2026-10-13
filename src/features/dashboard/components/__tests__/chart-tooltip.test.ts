import { describe, expect, it } from 'vite-plus/test'
import { tooltipSurface } from '../chart-tooltip'

describe('tooltipSurface', () => {
  it('uses the dark popover surface with light text in dark mode', () => {
    const surface = tooltipSurface(true)
    expect(surface.backgroundColor).toBe('#0b0c10')
    expect(surface.textStyle.color).toBe('#f7f8f8')
    expect(surface.borderColor).toBe('rgba(255, 255, 255, 0.054)')
  })

  it('uses the light popover surface with dark text in light mode', () => {
    const surface = tooltipSurface(false)
    expect(surface.backgroundColor).toBe('#ffffff')
    expect(surface.textStyle.color).toBe('#08090a')
    expect(surface.borderColor).toBe('rgba(208, 214, 224, 0.6)')
  })

  it('carries the chip recipe: 1px border, card radius, md shadow, 12px text', () => {
    for (const isDark of [true, false]) {
      const surface = tooltipSurface(isDark)
      expect(surface.borderWidth).toBe(1)
      expect(surface.borderRadius).toBe(8)
      expect(surface.extraCssText).toContain('box-shadow')
      expect(surface.textStyle.fontSize).toBe(12)
    }
  })
})
