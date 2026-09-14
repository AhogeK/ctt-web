<script setup lang="ts">
/**
 * TrophyMedal — the artwork for one trophy, drawn inline so its tier drives the
 * paint rather than selecting among pre-rendered images.
 *
 * One path set per family, a shared 24×24 grid, one stroke weight. A new tier
 * therefore needs no new asset; only the paint changes.
 *
 * **Colour stays inside the design system.** `DESIGN.md` is explicit that the
 * palette is almost entirely achromatic, that brand indigo is the only chromatic
 * colour, and that it must not be used decoratively. A trophy wall is exactly
 * where that rule would be tempting to break with bronze/silver/gold — so instead
 * the grades are rungs of the *existing* indigo ramp (the same stops the trend
 * chart and distribution bars use), and "locked" is expressed by dropping the
 * fill entirely. Rank is therefore carried by luminance + fill presence, never by
 * importing a second palette.
 */
import { computed } from 'vue'
import { TROPHY_RING_RADIUS, TROPHY_RING_STROKE, medalFitTransform, type TrophyArt } from '../composables/trophy-model'

const props = defineProps<{
  /** Which family's shape to draw. */
  art: TrophyArt
  /**
   * Visual grade, 0 = locked, 1..3 = earned tiers from lowest to highest, and
   * `maxed` for a completed ladder. Kept as a small ordinal rather than the tier
   * count itself so a 2-rung and a 3-rung ladder read with the same range of
   * contrast.
   */
  grade: 0 | 1 | 2 | 3
  /** True when the whole ladder is complete — adds the outer ring. */
  maxed: boolean
  /** Size in px. */
  size?: number
}>()

/**
 * Medal paint.
 *
 * **One brand colour for every grade, and it is the accessible one.** The first
 * version graded the artwork by walking the indigo ramp's *bright* end, which put
 * the dark-mode stop (`#b9c1ff`) on a light card at **1.73:1** — well under the
 * 3:1 floor for non-text graphics, so a maxed trophy was nearly invisible in light
 * mode. Trying the "correct" light stop (`#8a97f2`) only reached 2.70:1: the real
 * fault was encoding rank as *luminance*, a quantity whose direction has to flip
 * between modes.
 *
 * So rank is carried by fill, and accessibility by stroke:
 *
 * - **Stroke is always `#5e6ad2`** — the project's own brand indigo, measured at
 *   **4.70:1 on white and 3.71:1 on the dark surface**, the one value in the
 *   palette that clears 3:1 in *both* modes. It therefore needs no mode branch.
 * - **Fill opacity carries the grade** (0 / .2 / .45 / .85), so "how far along"
 *   is still legible at a glance without a second colour or a mode-dependent ramp.
 * - **A completed ladder adds an outer ring**, the one decoration rank may add.
 *
 * Locked artwork also thins its stroke and drops to the muted foreground, which is
 * a *redundant* second signal on purpose — "nothing earned yet" must survive being
 * printed in greyscale.
 */
const BRAND = '#5e6ad2'
/** Fill opacity per grade, index 0 = locked. */
const FILL_OPACITY = [0, 0.2, 0.45, 0.85] as const

const fillOpacity = computed(() => FILL_OPACITY[props.grade])

/** Template alias — the artwork selector reads better as a bare name. */
const shape = computed(() => props.art)

/**
 * The ring's geometry, shared with the model so the artwork's fit and the ring it
 * fits inside cannot drift apart (the unit tests assert the one contains the other).
 */
const ringRadius = TROPHY_RING_RADIUS
const ringStroke = TROPHY_RING_STROKE

/**
 * Fits the artwork inside the ring and centres it.
 *
 * Needed because the ring is already at the largest radius a 24-grid allows, so the
 * artwork must fit *it* rather than the other way round — and because the artworks
 * are not all centred or the same size: measured, the least (volume) is 11.32 units
 * from the centre and the most (the calendars) 13.08, against a ring inner edge at
 * 10.5. Without this the ring cut through every maxed trophy.
 */
const fit = computed(() => medalFitTransform(props.art))
</script>

<template>
  <svg
    :width="size ?? 40"
    :height="size ?? 40"
    viewBox="0 0 24 24"
    fill="none"
    :stroke-width="grade === 0 ? 1.25 : 1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    :class="grade === 0 ? 'text-muted-foreground/50' : ''"
    :style="{ stroke: BRAND, fill: BRAND, fillOpacity }"
    aria-hidden="true"
  >
    <!-- Completing a ladder earns a ring, the one decoration rank may add. Drawn
         before (under) the artwork and OUTSIDE the fitting group below, so the
         artwork's scale cannot resize the ring it is being fitted into. -->
    <circle
      v-if="maxed"
      cx="12"
      cy="12"
      :r="ringRadius"
      :stroke="BRAND"
      :stroke-width="ringStroke"
      fill="none"
      opacity="0.6"
    />

    <!-- Every artwork is scaled and re-centred to sit inside the ring. -->
    <g :transform="fit">
      <!-- Streak: a flame. -->
      <template v-if="shape === 'streak'">
        <path
          d="M12 3c.6 3 3.2 4.2 4.4 6.6a5.6 5.6 0 0 1-1 6.6A5.2 5.2 0 0 1 7 14.4c0-2.4 1.6-3.6 2.4-5.4.6 1.2 1.4 1.8 2.2 2.2C11.4 8.8 12 6 12 3Z"
        />
      </template>

      <!-- Volume: an hourglass, time accumulated. -->
      <template v-else-if="shape === 'volume'">
        <path d="M7 3h10M7 21h10M8 3v3.2c0 1.6 1.2 2.6 2.6 3.8L12 12l1.4 2c1.4 1.2 2.6 2.2 2.6 3.8V21" />
        <path d="M16 3v3.2c0 1.6-1.2 2.6-2.6 3.8L12 12l-1.4 2c-1.4 1.2-2.6 2.2-2.6 3.8V21" />
      </template>

      <!-- Polyglot: layered braces. -->
      <template v-else-if="shape === 'polyglot'">
        <path d="M9 4c-2 0-2.5 1-2.5 2v2c0 1.2-.6 2-2.5 2 1.9 0 2.5.8 2.5 2v2c0 1 .5 2 2.5 2" />
        <path d="M15 4c2 0 2.5 1 2.5 2v2c0 1.2.6 2 2.5 2-1.9 0-2.5.8-2.5 2v2c0 1-.5 2-2.5 2" />
      </template>

      <!-- Active days: a calendar with marked days — the days you showed up. -->
      <template v-else-if="shape === 'activeDays'">
        <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
        <path d="M3.5 9.5h17M8 3.5V6M16 3.5V6" />
        <path d="M7.5 13h1.5M11.25 13h1.5M15 13h1.5M7.5 16.75h1.5M11.25 16.75h1.5" />
      </template>

      <!-- Early bird: sun over a horizon. -->
      <template v-else-if="shape === 'earlyBird'">
        <circle cx="12" cy="13" r="3.6" />
        <path d="M12 4.5v1.8M5.6 13H3.8M20.2 13h-1.8M7.5 8.5 6.2 7.2M16.5 8.5l1.3-1.3M3 17.5h18" />
      </template>

      <!-- Night owl: crescent moon. -->
      <template v-else-if="shape === 'nightOwl'">
        <path d="M20 14.4A8.4 8.4 0 0 1 9.6 4a8.4 8.4 0 1 0 10.4 10.4Z" />
      </template>

      <!-- Marathon: a lightning bolt. -->
      <template v-else-if="shape === 'burst'">
        <path d="M13.4 2.5 5 13.2h5.2L9.9 21.5 18.5 10.8h-5.3l.2-8.3Z" />
      </template>

      <!-- Perfect month: a calendar page fully marked. -->
      <template v-else-if="shape === 'perfectMonth'">
        <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
        <path d="M3.5 9.5h17M8 3.5V6M16 3.5V6" />
        <path d="m8.8 15.2 2.2 2.2 4.2-4.4" />
      </template>

      <!-- Generic: a badge outline, for a code this build does not know. -->
      <template v-else>
        <circle cx="12" cy="10.5" r="6" />
        <path d="m9 15.8-1.4 5.7 4.4-2.4 4.4 2.4-1.4-5.7" />
      </template>
    </g>
  </svg>
</template>
