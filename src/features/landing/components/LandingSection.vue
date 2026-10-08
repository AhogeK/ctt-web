<script setup lang="ts">
/**
 * Landing section shell — the single place a marketing section's container width, horizontal
 * padding and vertical rhythm are decided, so later sections inherit them instead of inventing
 * their own.
 *
 * Values, stated here so they can be checked in one place:
 * - container 1440px carrying the shell's own rail (16px, 24px from `sm`) — the same box and rail
 *   the top bar and the hero use, so every content edge on the page starts on one line
 * - prose column ~730px (measured baseline); its box folds the rail in, so the column itself
 *   stays 730px
 * - section rhythm 80px desktop → 48px mobile
 *
 * The root element is exposed (`defineExpose`) so a parent can anchor scroll choreography to a
 * band's real box (the landing stage's exit dissolve is anchored to the first band's position).
 */
import { ref } from 'vue'

interface Props {
  /** Semantic element. Bands that are not a section (footer/header) say so. */
  as?: 'section' | 'div' | 'footer' | 'header' | 'article'
  /** Vertical rhythm step; `none` when a nested band owns its own padding. */
  spacing?: 'none' | 'sm' | 'md' | 'lg'
  /** `container` = the 1440px shell grid; `prose` = the reading column; `full` = edge to edge. */
  width?: 'container' | 'prose' | 'full'
}

const props = withDefaults(defineProps<Props>(), {
  as: 'section',
  spacing: 'lg',
  width: 'container',
})

const el = ref<HTMLElement | null>(null)
defineExpose({ el })

const rhythm = {
  none: '',
  sm: 'py-8 md:py-12',
  md: 'py-12 md:py-16',
  lg: 'py-12 md:py-20',
} as const

const measure = {
  container: 'mx-auto w-full max-w-[1440px] px-4 sm:px-6',
  prose: 'mx-auto w-full max-w-[762px] px-4 sm:max-w-[778px] sm:px-6',
  full: 'w-full',
} as const
</script>

<template>
  <component :is="props.as" ref="el" :class="[rhythm[props.spacing]]">
    <div :class="measure[props.width]">
      <slot />
    </div>
  </component>
</template>
