# achievements — trophy geometry

## SVG geometry: measure it, never assume the viewBox is filled

The medal artwork is drawn on a 24×24 grid, and the ring a completed ladder earns sits
at `r=11` — the largest radius the grid allows (outer paint reaches 11.5 of the 12
available). So the artwork must fit *inside* the ring, and the only way to know whether
it does is to measure it.

It did not. Every one of the nine artworks overflowed, by 0.82 to **2.58** units:

| Artwork | Farthest painted point | Ring inner edge | Overflow |
| --- | --- | --- | --- |
| calendars (`activeDays`, `perfectMonth`) | 13.08 | 10.5 | +2.58 |
| `nightOwl` | 13.04 | 10.5 | +2.54 |
| `burst` | 12.85 | 10.5 | +2.35 |
| `earlyBird` | 12.77 | 10.5 | +2.27 |
| `polyglot` | 12.37 | 10.5 | +1.87 |
| `generic` | 12.27 | 10.5 | +1.77 |
| `streak` | 11.35 | 10.5 | +0.85 |
| `volume` | 11.32 | 10.5 | +0.82 |

Six were also **off-centre**, by up to 2 units (`polyglot`'s centre sits 2 units above
the grid centre, `generic` 1 below, `nightOwl` off in both axes) — which is why the
artwork looked off-axis inside the ring once one was drawn.

How to measure, and how not to:

- Use a **real browser**. `getBBox()` is a layout API: in jsdom it returns zeros, so a
  DOM-level assertion about geometry cannot fail. This is why the regression tests
  assert the *algebra* of the transform instead.
- `getBBox()` **excludes the stroke** — add half the stroke width on each side, or the
  measurement is short by that much.
- `getBBox()` on a `<g>` returns **local** coordinates, *before* its own transform, and
  `getBoundingClientRect()` returns screen pixels. Composing the two by hand is easy to
  get wrong: a first attempt divided by the wrong scale factor and reported a uniform
  +9.6 shift that looked like a real bug. Cross-check against something whose geometry
  is already known (the ring: `cx=cy=12`, `r=11`) before believing the numbers.

The fix is a `<g>` transform that scales each artwork about **its own centre** and maps
that centre onto the grid centre, so every medal ends up the same size and on-axis:

```
translate(CENTER*(1-s) - s*offset) scale(s)      // offset = art centre - grid centre
```

**The `CENTER*(1-s)` term is the part that is easy to omit.** A first version wrote
`translate(CENTER - s*offset)`, which scales the offset but not the grid centre and
leaves every artwork displaced by `CENTER*(1-s)` — 4.7 units at `s≈0.61`, nearly half
the icon. It looked plausible in review and only showed up when the rendered page was
measured (centres read 21.6 instead of 12). Both the live measurement and the unit test
now pin the centre exactly.
