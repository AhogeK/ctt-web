<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore, type ThemeMode } from '@/stores/theme'
import { Icon } from '@iconify/vue'

/**
 * Theme toggle button for auth pages.
 * Cycles through: auto → dark → light → auto
 * Uses ghost button styling from DESIGN.md.
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
    class="theme-toggle"
    :aria-label="`Current theme: ${themeStore.mode}. Click to change.`"
    @click="cycleTheme"
  >
    <Icon :icon="currentIcon" class="theme-toggle__icon" />
  </button>
</template>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgb(36, 40, 44);
  color: #d0d6e0;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
  outline: none;
}

.theme-toggle:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.08);
  color: #f7f8f8;
}

.theme-toggle:focus-visible {
  box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 12px;
}

/* Light mode styles */
:root:not(.dark) .theme-toggle {
  background: rgba(0, 0, 0, 0.02);
  border-color: #d0d6e0;
  color: #62666d;
}

:root:not(.dark) .theme-toggle:hover {
  background: rgba(0, 0, 0, 0.04);
  border-color: #8a8f98;
  color: #1a1a2e;
}

.theme-toggle__icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}
</style>
