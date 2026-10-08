# theme-system · principles

## Tone for regions, light for objects

Two different jobs, two different cues:

- Region separation (nav vs main) — **fill step** — ~1.2–1.4:1 — large areas read far below what a hairline needs
- Object quality (a card) — **directional light** — specular band, lit top edge, rim, sink — perception, not a
  single ratio; it needs *variation* across the face

Confusing the two is what produced both rejected versions: a hairline raised to 1.9:1 everywhere bought
wireframe (region job done with an object cue), and a pale `#32333a` card bought "matte grey" (object job
done with a region cue).

## Why a static review cannot settle gloss

Gloss is the response of a surface to a light source — it changes with viewing angle, pointer position and
the panel. A single raster keeps only the static shading, so "satin vs lacquer" from a screenshot is a
weak instrument; treat it as directional evidence ("is the sheen visible at all") and leave the verdict to
the user's screen.

The same limit applies with a sharper edge to **1 px cues**: a compressed screenshot resolved neither a
0.06 nor a 0.08 white inset, and called both a no-op. A capture can prove *absence* (nothing abrupt, no
band) but cannot prove *presence* at that scale — that one belongs to the user's panel, and the numbers
(≥ 1.2:1 against the surface) are how the choice is made before anyone looks.

## Why the numbers still matter

Every fill move re-checks the text on it (`--muted-foreground` was already pushed under AA once by an
earlier raise). The sequence that works: choose the fill from the region budget, solve any text token the
raise invalidates, then apply light and shadow for the object read — and verify all three on a render.
