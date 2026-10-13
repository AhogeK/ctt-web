/**
 * Shared ECharts tooltip surface — the dashboard's overlay recipe, mirroring
 * the time-of-day info chip: popover background, a 60% border, the card
 * radius and the md shadow.
 *
 * Tooltips used to invert the theme (a near-white bubble in dark mode), which
 * glows against the dark card; the theme-following surface is the language
 * every other floating readout already uses.
 *
 * ECharts renders the tooltip into the chart's DOM container, so the values
 * must be concrete colours — these restate main.css's light/dark `--popover`,
 * `--border` and `--popover-foreground` tokens. When a token moves, move it
 * here too. Hover-point HALOS are the opposite case on purpose: their ring
 * must contrast with the surface, so they stay a per-panel palette value.
 */

export interface TooltipSurface {
  backgroundColor: string
  borderColor: string
  borderWidth: number
  borderRadius: number
  padding: [number, number]
  /** `box-shadow` appended to the tooltip element — Tailwind's shadow-md pair. */
  extraCssText: string
  textStyle: { color: string; fontFamily: string; fontSize: number }
}

/** Tailwind `shadow-md`, spelled out because ECharts takes CSS text. */
const SHADOW_MD = 'box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);'

export function tooltipSurface(isDark: boolean): TooltipSurface {
  return isDark
    ? {
        backgroundColor: '#0b0c10', // --popover (dark)
        borderColor: 'rgba(255, 255, 255, 0.054)', // --border (white 9%) at 60%
        borderWidth: 1,
        borderRadius: 8, // card/dropdown/popover radius
        padding: [8, 12],
        extraCssText: SHADOW_MD,
        textStyle: { color: '#f7f8f8', fontFamily: 'Inter, sans-serif', fontSize: 12 },
      }
    : {
        backgroundColor: '#ffffff', // --popover (light)
        borderColor: 'rgba(208, 214, 224, 0.6)', // --border #d0d6e0 at 60%
        borderWidth: 1,
        borderRadius: 8,
        padding: [8, 12],
        extraCssText: SHADOW_MD,
        textStyle: { color: '#08090a', fontFamily: 'Inter, sans-serif', fontSize: 12 },
      }
}
