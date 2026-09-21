# auth-layout — principles

## P1. A card's own pseudo-element cannot be occluded by a neighbour

`A < B` and `B < A` cannot both hold, and a card's inline `transform` makes it a stacking context, so its
`::after` is trapped inside the card. Consequence: "light passes behind the card below" is expressible
only from a **shared layer below every card**. That is why the underglow lives at the scene root
(`z-index: 0`, explicit class selectors — the old `nth-child` position rules silently re-assigned the
layers whenever the scene's child order changed).

## P2. The glow box must outlive the light

A background can never paint outside its own box. If the box ends mid-falloff, `blur` turns the cliff
into a rounded "light shield" edge — the invisible wall the user kept seeing. Budget: box margin
`B ≥ R_perceptual + 2σ`. (First attempt used a card-width box against a 320px gradient: pure cliff.)

## P3. Anchor the light to the card, not to the pointer

The underglow belongs to the card; the pointer only excites it. The visible box must not move while the
pointer moves inside a card — only the bright core does. A pointer-anchored large radius reads as "the
mouse is dragging a big glow", which is a different (and wrong) effect.

## P4. Freeze geometry before differencing pixels

Hover changes the card's transform (1.03 scale + rotation), so every glyph and border inside the card
moves. A naive hover-vs-idle diff therefore measures **motion**, not light: the first A3 measurement read
25.3 counts "light through the card" and collapsed to 3.7 once `transform: none !important` was injected.
Inject that freeze before concluding anything about light.
