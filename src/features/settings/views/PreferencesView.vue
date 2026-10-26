<script setup lang="ts">
/**
 * Preferences settings view.
 *
 * Two sections today: Appearance (the same three modes the header's Appearance
 * menu writes) and Language (the switcher that owns the interface locale).
 * Motion preferences join this page when their stage lands; nothing is mocked
 * in the meantime.
 *
 * Both sections are the same shape — a labelled radio group whose change writes
 * through the single owner of that state (the theme store, the locale module),
 * never storage or the DOM directly. The option surfaces are presentation: a
 * theme tile previews its own frame, and a language row carries its endonym and
 * code, while the native radio remains the control.
 */
import { computed, type Component } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check, Info, Languages, Monitor, Moon, Sun, SunMoon } from '@lucide/vue'
import { currentLocale, LANGUAGE_CODES, setLocale } from '@/i18n'
import { useThemeStore, type ThemeMode } from '@/stores/theme'
import type { AppLocale } from '@/i18n/locale'
import ChoiceRadioGroup from '../components/ChoiceRadioGroup.vue'
import ThemePreview from '../components/ThemePreview.vue'

const { t } = useI18n()
const themeStore = useThemeStore()

/** The resolved label for the active mode — "System" reports which theme it resolves to. */
const currentThemeLabel = computed(() => {
  if (themeStore.mode === 'auto') {
    return themeStore.isDark ? t('theme.systemDark') : t('theme.systemLight')
  }
  return themeStore.mode === 'dark' ? t('theme.dark') : t('theme.light')
})

const THEME_ICONS: Record<ThemeMode, Component> = {
  auto: Monitor,
  light: Sun,
  dark: Moon,
}

function themeIconFor(value: string): Component {
  return THEME_ICONS[value as ThemeMode] ?? Monitor
}

const themeOptions = computed(() => [
  { value: 'auto', label: t('theme.system'), preview: 'system' as const },
  { value: 'light', label: t('theme.light'), preview: 'light' as const },
  { value: 'dark', label: t('theme.dark'), preview: 'dark' as const },
])

/** Language names stay endonyms in both catalogues: a reader must recognise their own language. */
const languageOptions = computed(() => [
  { value: 'en', label: t('language.english'), code: LANGUAGE_CODES.en },
  { value: 'zh-CN', label: t('language.chineseSimplified'), code: LANGUAGE_CODES['zh-CN'] },
])

function handleThemeChange(value: string): void {
  themeStore.setTheme(value as ThemeMode)
}

function handleLanguageChange(value: string): void {
  void setLocale(value as AppLocale)
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-[1120px] flex-col gap-6 p-6 lg:p-8">
    <header class="flex flex-col gap-2.5">
      <h1 class="text-heading-1 font-emphasis text-foreground">{{ t('settings.preferences.title') }}</h1>
      <p class="max-w-[58ch] text-sm leading-6 text-muted-foreground">
        {{ t('settings.preferences.subtitle') }}
      </p>
    </header>

    <div class="grid gap-5 xl:grid-cols-12">
      <section
        aria-labelledby="preferences-appearance-heading"
        class="flex flex-col rounded-xl border border-border bg-card p-5 sm:p-6 xl:col-span-7"
        data-surface="card"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="flex min-w-0 items-start gap-3">
            <span
              class="grid size-8 shrink-0 place-items-center rounded-md border border-border bg-secondary/50 text-muted-foreground"
            >
              <SunMoon class="size-4" aria-hidden="true" />
            </span>
            <div class="min-w-0">
              <h2 id="preferences-appearance-heading" class="text-heading-3 text-foreground">
                {{ t('settings.preferences.appearance') }}
              </h2>
              <p class="mt-1 text-sm leading-6 text-muted-foreground">
                {{ t('settings.preferences.appearanceDescription') }}
              </p>
            </div>
          </div>
          <span
            class="whitespace-nowrap rounded-full border border-border bg-secondary/40 px-2.5 py-1 text-[11px] font-emphasis text-muted-foreground"
          >
            {{ t('settings.preferences.current', { value: currentThemeLabel }) }}
          </span>
        </div>

        <ChoiceRadioGroup
          name="theme"
          :legend="t('settings.preferences.theme')"
          :model-value="themeStore.mode"
          :options="themeOptions"
          class="mt-5"
          @update:model-value="handleThemeChange"
        >
          <template #option="{ option, checked }">
            <span
              class="block overflow-hidden rounded-lg border bg-background/40 transition-[border-color,background-color,box-shadow] duration-150 motion-reduce:transition-none peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring"
              :class="
                checked
                  ? 'border-primary/70 bg-primary/5 ring-1 ring-primary/20'
                  : 'border-border hover:border-foreground/25'
              "
            >
              <span class="block border-b border-border/70 bg-muted/30 p-1.5">
                <ThemePreview v-if="option.preview" :variant="option.preview" />
              </span>
              <span class="flex items-center justify-between gap-2 px-3 py-2.5">
                <span class="flex min-w-0 items-center gap-2">
                  <component
                    :is="themeIconFor(option.value)"
                    class="size-3.5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span class="truncate text-sm font-emphasis text-foreground">{{ option.label }}</span>
                </span>
                <span
                  class="grid size-4 shrink-0 place-items-center rounded-full border"
                  :class="
                    checked ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-transparent'
                  "
                >
                  <Check class="size-2.5" aria-hidden="true" />
                </span>
              </span>
            </span>
          </template>
        </ChoiceRadioGroup>
      </section>

      <section
        aria-labelledby="preferences-language-heading"
        class="flex flex-col rounded-xl border border-border bg-card p-5 sm:p-6 xl:col-span-5"
        data-surface="card"
      >
        <div class="flex items-start gap-3">
          <span
            class="grid size-8 shrink-0 place-items-center rounded-md border border-border bg-secondary/50 text-muted-foreground"
          >
            <Languages class="size-4" aria-hidden="true" />
          </span>
          <div class="min-w-0">
            <h2 id="preferences-language-heading" class="text-heading-3 text-foreground">
              {{ t('settings.preferences.language') }}
            </h2>
            <p class="mt-1 text-sm leading-6 text-muted-foreground">
              {{ t('settings.preferences.languageDescription') }}
            </p>
          </div>
        </div>

        <ChoiceRadioGroup
          name="language"
          :legend="t('settings.preferences.language')"
          :model-value="currentLocale"
          :options="languageOptions"
          class="mt-5"
          @update:model-value="handleLanguageChange"
        >
          <template #option="{ option, checked }">
            <span
              class="flex h-full items-center gap-3 rounded-lg border bg-background/40 p-3 transition-[border-color,background-color,box-shadow] duration-150 motion-reduce:transition-none peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring"
              :class="
                checked
                  ? 'border-primary/70 bg-primary/5 ring-1 ring-primary/20'
                  : 'border-border hover:border-foreground/25'
              "
            >
              <span
                class="grid size-9 shrink-0 place-items-center rounded-md border border-border bg-secondary/50 text-[11px] font-emphasis tracking-wide text-foreground"
              >
                {{ option.code }}
              </span>
              <span class="min-w-0 flex-1 truncate text-sm font-emphasis text-foreground">
                {{ option.label }}
              </span>
              <span
                class="grid size-4 shrink-0 place-items-center rounded-full border"
                :class="
                  checked ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-transparent'
                "
              >
                <Check class="size-2.5" aria-hidden="true" />
              </span>
            </span>
          </template>
        </ChoiceRadioGroup>

        <p class="mt-auto flex items-start gap-2 pt-5 text-xs leading-5 text-muted-foreground">
          <Info class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>{{ t('settings.preferences.storageNote') }}</span>
        </p>
      </section>
    </div>
  </div>
</template>
