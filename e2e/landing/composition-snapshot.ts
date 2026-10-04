/**
 * Desktop composition baseline, recorded on the 0.53.0 build. Purpose: the relationship gates in
 * the spec prove the panel is in the right area and that both themes agree — they **cannot** prove
 * both themes did not drift *together*. These numbers close that hole: any change that moves the
 * composition shows up as a per-rect delta.
 *
 * Desktop numbers must stay as they are; the two viewports excepted here (low-height desktop, phone)
 * carry their own acceptance further down instead. The plane's and panel's horizontal position were
 * re-recorded when the plane's right edge was aligned to the container's right edge — their sizes and
 * every vertical value are unchanged.
 */
export const SNAPSHOT_DESKTOP = {
  900: {
    panel: { top: 112, bottom: 434, left: 948, right: 1311, width: 363, height: 322 },
    plane: { top: 306, bottom: 936, left: 681, right: 1416, width: 735, height: 629 },
    cta: { top: 431, bottom: 471, left: 24, right: 181, width: 157, height: 40 },
  },
  1080: {
    panel: { top: 202, bottom: 524, left: 948, right: 1311, width: 363, height: 322 },
    plane: { top: 396, bottom: 1026, left: 681, right: 1416, width: 735, height: 629 },
    cta: { top: 521, bottom: 561, left: 24, right: 181, width: 157, height: 40 },
  },
} as const
