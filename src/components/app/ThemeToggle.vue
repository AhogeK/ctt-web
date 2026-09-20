<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore, type ThemeMode } from '@/stores/theme'
import { Icon } from '@iconify/vue'

/**
 * Theme toggle, shared by the auth and marketing shells.
 *
 * Every colour here resolves to a design-system token through the semantic utilities
 * bound in `src/assets/main.css` — no literal values, no second `:root:not(.dark)` block
 * to keep in step, because each token already carries both themes:
 *
 * - icon at rest   `text-muted-foreground`  (dark `#8a8f98` / light `#62666d`)
 * - icon on hover  `text-foreground`        (dark `#f7f8f8` / light `#08090a`)
 * - surface        transparent → `hover:bg-secondary`
 * - border         `border-border`          (dark `rgba(255,255,255,0.08)` / light `#d0d6e0`)
 * - focus          `ring-ring`, the same idiom the rest of the app uses
 *
 * The hover state needs no `@media (hover: hover)` guard of its own: Tailwind compiles
 * the `hover:` variant into that query, so a touch device cannot leave a stuck hover.
 * Measured contrast (2026-09-20, `getComputedStyle` composited over the page): the icon
 * clears 4.5:1 in all four theme × state combinations — 5.86 / 17.90 / 5.74 / 18.10, so
 * the worst case is 5.74:1.
 */
const themeStore = useThemeStore()

/** Icon name to display based on current theme mode */
const currentIcon = computed(() => {
  switch (themeStore.mode) {
    case 'dark':
      return 'lucide:moon'
    case 'light':
      return 'lucide:sun'
    default:
      return 'lucide:monitor'
  }
})

/** Cycle through theme modes: auto → dark → light → auto */
function cycleTheme(): void {
  const modes: ThemeMode[] = ['auto', 'dark', 'light']
  const currentIndex = modes.indexOf(themeStore.mode)
  const nextIndex = (currentIndex + 1) % modes.length
  const nextMode = modes[nextIndex]
  if (nextMode) {
    themeStore.setTheme(nextMode)
  }
}
</script>

<template>
  <button
    type="button"
    class="inline-flex cursor-pointer items-center justify-center rounded-sm border border-border bg-transparent p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    :aria-label="`Current theme: ${themeStore.mode}. Click to change.`"
    @click="cycleTheme"
  >
    <Icon :icon="currentIcon" class="size-4.5 shrink-0" />
  </button>
</template>
