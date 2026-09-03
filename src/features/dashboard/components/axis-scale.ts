/**
 * Shared Y-axis scale for hour-based charts — pick a readable, evenly-spaced
 * scale for a data peak in seconds.
 *
 * Slides a 3–6 tick window across the readable HOUR_STEPS and takes the
 * first (finest) step whose ceiling holds the peak — so 1h57m tops at 2h
 * (step 0.5), 2h01m at 2.5h, and 2h29m stays at 2.5h (the step does not jump
 * just because the peak crept past the midpoint). When the peak lands
 * EXACTLY on a gridline, one extra step is added so the curve never rides
 * the top line. Split lines stay strictly equidistant: both `max` and
 * `interval` are explicit.
 *
 * HOUR_STEPS spans 0.01h (36s) to 24h: per-hour AVERAGES can be tiny (a
 * 10-minute hour averages 600s = 0.17h), so the ladder must reach
 * sub-tenth-of-an-hour steps — otherwise a minute-scale peak gets stretched
 * onto a multi-hour axis (the "0 / 8 / 16 h" failure).
 */

/** Readable hour steps — 0.01h (36s) up to a full day. */
const HOUR_STEPS = [0.01, 0.02, 0.05, 0.1, 0.25, 0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 24] as const

export interface HourAxisScale {
  intervalSeconds: number
  maxSeconds: number
  tickCount: number
}

export function getHourAxisScale(maxSeconds: number): HourAxisScale {
  const maxHours = maxSeconds / 3600
  // Array literal guarantees the last element — non-null assertion is safe.
  let stepHours: number = HOUR_STEPS.at(-1)!
  let ticks = Math.ceil(maxHours / stepHours)
  let peakOnGridline = false
  for (const step of HOUR_STEPS) {
    const raw = maxHours / step
    const ceiling = Math.ceil(raw - 1e-9)
    if (ceiling >= 3 && ceiling <= 6) {
      stepHours = step
      ticks = ceiling
      peakOnGridline = Math.abs(raw - ceiling) < 1e-9
      break
    }
  }
  // Sub-window fallback: below 3 × the finest step (averages under ~90s), no
  // step can yield the 3–6 tick window and the loop falls through to the 24h
  // default — stretching a minute-scale peak onto a 48h axis (the same
  // failure class as the original "0 / 8 / 16 h" bug). Clamp to the FINEST
  // step instead: the axis keeps minute granularity, just fewer gridlines.
  if (maxHours < 3 * 0.01) {
    const raw = maxHours / 0.01
    stepHours = 0.01
    ticks = Math.max(Math.ceil(raw - 1e-9), 1)
    peakOnGridline = Math.abs(raw - ticks) < 1e-9
  }
  const totalTicks = peakOnGridline ? ticks + 1 : ticks
  // Round: sub-0.1h steps are fractional hours and must yield whole seconds
  // (0.05h → 180s, not 180.00000000000003) or ECharts ticks drift.
  const maxHoursRounded = Math.round(Math.max(totalTicks * stepHours, stepHours * 2) * 3600) / 3600
  return {
    intervalSeconds: Math.round(stepHours * 3600),
    maxSeconds: Math.round(maxHoursRounded * 3600),
    tickCount: Math.round(maxHoursRounded / stepHours) + 1,
  }
}

/** Adaptive-precision hour label: "1 h" / "0.05 h" / "0.017 h" — never "0.0 h". */
export function formatHourLabelHours(hours: number): string {
  if (hours === 0) return '0 h'
  const precision = labelPrecision(hours)
  return `${Number(hours.toFixed(precision))} h`
}

/** Significant digits for an hour magnitude: 1h+ → 1 decimal, 0.1h+ → 2, below → 3. */
function labelPrecision(hours: number): number {
  if (hours >= 1) return 1
  if (hours >= 0.1) return 2
  return 3
}

/** Y-axis label formatter: takes SECONDS (the chart's value unit), returns "X h". */
export function formatHourLabel(seconds: number): string {
  return formatHourLabelHours(seconds / 3600)
}
