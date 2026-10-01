<script setup lang="ts">
/**
 * Landing section shell — the single place a marketing section's container width, horizontal
 * padding and vertical rhythm are decided, so later sections inherit them instead of inventing
 * their own.
 *
 * Values, stated here so they can be checked in one place:
 * - container 1200px · prose column ~730px (measured baseline)
 * - horizontal rail 24px → 32px (8px grid)
 * - section rhythm 80px desktop → 48px mobile
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
