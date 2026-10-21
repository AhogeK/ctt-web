<script setup lang="ts">
/**
 * Preferences settings view.
 *
 * Two sections today: Appearance (the same three modes the header's Appearance
 * menu writes) and Language (the switcher that owns the interface locale).
 * Motion preferences join this page when their stage lands; nothing is mocked
 * in the meantime.
 *
 * Both sections are the same shape — a labeled radio group whose change writes
 * through the single owner of that state (the theme store, the locale module),
 * never storage or the DOM directly.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useThemeStore, type ThemeMode } from '@/stores/theme'
import { currentLocale, setLocale } from '@/i18n'
import type { AppLocale } from '@/i18n/locale'
import ChoiceRadioGroup from '../components/ChoiceRadioGroup.vue'

const { t } = useI18n()
const themeStore = useThemeStore()

/** The resolved label for the active mode — "System" reports which theme it resolves to. */
const currentThemeLabel = computed(() => {
  if (themeStore.mode === 'auto') {
    return themeStore.isDark ? t('theme.systemDark') : t('theme.systemLight')
  }
  return themeStore.mode === 'dark' ? t('theme.dark') : t('theme.light')
})

const themeOptions = computed(() => [
  { value: 'auto', label: t('theme.system') },
  { value: 'light', label: t('theme.light') },
  { value: 'dark', label: t('theme.dark') },
])

/** Language names stay endonyms in both catalogues: a reader must recognise their own language. */
const languageOptions = computed(() => [
  { value: 'en', label: t('language.english') },
  { value: 'zh-CN', label: t('language.chineseSimplified') },
])

function handleThemeChange(value: string): void {
  themeStore.setTheme(value as ThemeMode)
}

function handleLanguageChange(value: string): void {
  void setLocale(value as AppLocale)
}
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <div class="flex flex-col gap-2">
      <h1 class="text-2xl font-semibold">{{ t('settings.preferences.title') }}</h1>
      <p class="text-sm text-muted-foreground">{{ t('settings.preferences.subtitle') }}</p>
    </div>

    <section aria-labelledby="preferences-appearance-heading" class="rounded-lg border p-5">
      <div class="mb-4 flex flex-col gap-1">
        <h2 id="preferences-appearance-heading" class="text-lg font-medium">
          {{ t('settings.preferences.appearance') }}
        </h2>
        <p class="text-sm text-muted-foreground">
          {{ t('settings.preferences.current', { value: currentThemeLabel }) }}
        </p>
      </div>
      <ChoiceRadioGroup
        name="theme"
        :legend="t('settings.preferences.theme')"
        :model-value="themeStore.mode"
        :options="themeOptions"
        @update:model-value="handleThemeChange"
      />
    </section>

    <section aria-labelledby="preferences-language-heading" class="rounded-lg border p-5">
      <div class="mb-4 flex flex-col gap-1">
        <h2 id="preferences-language-heading" class="text-lg font-medium">
          {{ t('settings.preferences.language') }}
        </h2>
        <p class="text-sm text-muted-foreground">{{ t('settings.preferences.languageDescription') }}</p>
      </div>
      <ChoiceRadioGroup
        name="language"
        :legend="t('settings.preferences.language')"
        :model-value="currentLocale"
        :options="languageOptions"
        @update:model-value="handleLanguageChange"
      />
    </section>
  </div>
</template>
