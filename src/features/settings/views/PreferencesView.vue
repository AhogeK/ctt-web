<script setup lang="ts">
/**
 * Preferences settings view.
 *
 * Appearance is the first section here: the same three modes the header's
 * Appearance menu writes (auto / light / dark). The theme store stays the
 * single mutator — this page never touches document classes or storage
 * directly. Language and motion preferences join this page as their stages
 * land; nothing is mocked in the meantime.
 */
import { computed } from 'vue'
import { useThemeStore, type ThemeMode } from '@/stores/theme'

const themeStore = useThemeStore()

/** The resolved label for the active mode — "System" reports which theme it resolves to. */
const currentLabel = computed(() => {
  if (themeStore.mode === 'auto') {
    return themeStore.isDark ? 'System (Dark)' : 'System (Light)'
  }
  return themeStore.mode === 'dark' ? 'Dark' : 'Light'
})

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'auto', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

function handleThemeChange(value: ThemeMode): void {
  themeStore.setTheme(value)
}
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <div class="flex flex-col gap-2">
      <h1 class="text-2xl font-semibold">Preferences</h1>
      <p class="text-sm text-muted-foreground">Appearance and behaviour that apply to this browser.</p>
    </div>

    <section aria-labelledby="preferences-appearance-heading" class="rounded-lg border p-5">
      <div class="mb-4 flex flex-col gap-1">
        <h2 id="preferences-appearance-heading" class="text-lg font-medium">Appearance</h2>
        <p class="text-sm text-muted-foreground">Current: {{ currentLabel }}</p>
      </div>

      <fieldset class="min-w-0">
        <legend class="sr-only">Theme</legend>
        <div class="grid gap-2 sm:grid-cols-3">
          <label v-for="option in THEME_OPTIONS" :key="option.value" class="cursor-pointer">
            <input
              :checked="themeStore.mode === option.value"
              class="peer sr-only"
              name="theme"
              type="radio"
              :value="option.value"
              @change="handleThemeChange(option.value)"
            />
            <span
              class="flex items-center justify-center rounded-md border px-3 py-2 text-sm transition-colors peer-checked:border-primary peer-checked:bg-accent peer-checked:font-medium peer-checked:text-accent-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring hover:bg-accent/50"
            >
              {{ option.label }}
            </span>
          </label>
        </div>
      </fieldset>
    </section>
  </div>
</template>
