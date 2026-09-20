<script setup lang="ts">
/**
 * Landing section shell — the single place a marketing section's container width, horizontal
 * padding and vertical rhythm are decided, so later sections inherit them instead of inventing
 * their own.
 *
 * Every value comes from DESIGN.md and is auditable there:
 * - container 1200px (§5 Grid & Container) · prose column ~730px (measured baseline)
 * - horizontal rail 24px → 32px (8px grid, §5 Spacing System)
 * - section rhythm 80px desktop → 48px mobile (§8 Collapsing Strategy: "Section spacing: 80px+ → 48px on mobile")
 */
interface Props {
  /** Semantic element. Bands that are not a section (footer/header) say so. */
  as?: 'section' | 'div' | 'footer' | 'header' | 'article'
  /** Vertical rhythm step; `none` when a nested band owns its own padding. */
  spacing?: 'none' | 'sm' | 'md' | 'lg'
  /** `container` = the 1200px marketing grid; `prose` = the reading column; `full` = edge to edge. */
  width?: 'container' | 'prose' | 'full'
}

const props = withDefaults(defineProps<Props>(), {
  as: 'section',
  spacing: 'lg',
  width: 'container',
})

const rhythm = {
  none: '',
  sm: 'py-8 md:py-12',
  md: 'py-12 md:py-16',
  lg: 'py-12 md:py-20',
} as const

const measure = {
  container: 'mx-auto w-full max-w-[1200px]',
  prose: 'mx-auto w-full max-w-[730px]',
  full: 'w-full',
} as const
</script>

<template>
  <component :is="props.as" :class="[rhythm[props.spacing], 'px-6 md:px-8']">
    <div :class="measure[props.width]">
      <slot />
    </div>
  </component>
</template>
