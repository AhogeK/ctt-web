/**
 * Desktop composition baseline. Purpose: the relationship gates in the spec prove the panel is in
 * the right area and that both themes agree — they **cannot** prove both themes did not drift
 * *together*. These numbers close that hole: any change that moves the composition shows up as a
 * per-rect delta.
 *
 * Desktop numbers must stay as they are; the two viewports excepted here (low-height desktop, phone)
 * carry their own acceptance further down instead.
 *
 * Recorded history — a re-record is a deliberate act, not a formality:
 * - 0.53.0 — first baseline. The plane's and panel's horizontal values moved once when the plane's
 *   right edge was aligned to the container's right edge; sizes and every vertical value stayed.
 * - 2026-10-12 (v0.56.0) — re-recorded because the summary cards gained their change lines (a
 *   user-requested feature: the hero preview shows the real product), which makes the plane ~53px
 *   taller and shifts the centred hero up by half of that. The recording state also changed: the
 *   spec now waits for every time-based entrance clock to finish (`settleHero`), because the old
 *   signal — the plane wrapper's opacity — read `1` at mount and measurements slid with load
 *   latency; these numbers are the settled state and are stable across runs.
 */
export const SNAPSHOT_DESKTOP = {
  900: {
    panel: { top: 136.84, bottom: 462.9, left: 947.66, right: 1310.88, width: 363.22, height: 326.06 },
    plane: { top: 330.43, bottom: 1012.39, left: 680.68, right: 1415.8, width: 735.12, height: 681.96 },
    cta: { top: 459, bottom: 499, left: 24, right: 180.92, width: 156.92, height: 40 },
  },
  1080: {
    panel: { top: 176.44, bottom: 502.5, left: 947.66, right: 1310.88, width: 363.22, height: 326.06 },
    plane: { top: 370.02, bottom: 1051.98, left: 680.68, right: 1415.8, width: 735.12, height: 681.96 },
    cta: { top: 498.59, bottom: 538.59, left: 24, right: 180.92, width: 156.92, height: 40 },
  },
} as const
