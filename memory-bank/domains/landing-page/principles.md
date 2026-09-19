# landing-page — principles

## L1. Similarity is not quality

A peer doing X proves the industry's status quo, not that X is good. In the sample taken, the
site **closest to ctt's own category was also the weakest by craft** — its choices are evidence of
nothing but its own existence. Grade a reference by its **own authority**, never by how much it
resembles us.

## L2. One sample is an anecdote; a pattern needs three

Every generalisation must rest on **≥3 independent samples measured with the same probe**. Single-
site study produced three wrong claims in one round (h1 weight 800, negative tracking as "the"
technique, "no motion needed"). Hit counts, not impressions: `8px grid — 44/50/26` is a finding;
"looks like an 8px grid" is not.

## L3. Evidence has tiers, and they are not interchangeable

| Tier | What it can decide | Example |
| --- | --- | --- |
| Rendered + computed styles | concrete values (sizes, spacing, radii, durations) | h1 = 64px / weight 510 / lh 1.0 |
| Stylesheet token tables | the *system* behind the values | `spacing-1=8px`, `color-bg=var(--grey-900)` |
| JS bundles | behaviour and mechanism | `prefers-color-scheme` + `matchMedia` in all three |
| Open-source component source | how it is actually built | `[&[data-state=open]>svg]:rotate-180` |

**Cross-validate across tiers.** CSS reporting zero animated elements *and* JS reporting no
`IntersectionObserver` is one finding confirmed twice. A screenshot is the weakest tier — it shows
the result, never the mechanism.

## L4. Adopt the pattern, not the dependency

ctt already ships `reka-ui` (Radix for Vue), Tailwind 4 and VueUse. Most patterns found in the
references are **already available** in this stack — the gap is usage, not capability. Never add a
package to imitate a reference (R12).

## L5. `DESIGN.md` owns the tokens; this page inherits

The landing page introduces **no new colour, shadow or spacing token**. Where `DESIGN.md` is silent
(for example a numeric touch-target rule), the addition is proposed to the user and written into
`DESIGN.md` — not invented locally. Measured industry values may *confirm* `DESIGN.md`; they never
override it.

## L6. The hero sells the product; the bar manages the account

Two different jobs, two different actions — never one repeated twice:

- **Hero action = the product itself.** For this project that is the IDE plugin
  (`plugins.jetbrains.com/plugin/29379`) — the thing the data comes from, one click from
  running. A credential form is a heavier first step than "install".
- **Top-bar entry = the account** ("I already have one"): `Sign in`, switching to
  `Open dashboard` when signed in.
- **Neither points at registration.** The usual "hero → signup" pattern assumes the signup page
  carries the OAuth buttons; this one does not, so that route dead-ends a GitHub user. Signup is
  reached from the login page's "Create account" link.
