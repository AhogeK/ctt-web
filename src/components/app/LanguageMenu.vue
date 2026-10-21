<script setup lang="ts">
/**
 * Language menu for the public shells (marketing top bar and the auth card).
 *
 * The signed-in shell reaches a language section inside the avatar menu; a visitor has
 * no menu, so the public pages carry their own.
 *
 * Design language: a **32px square** in the top bar's icon-button family — the same box
 * as ThemeToggle — carrying the active language's one-glyph code. A square keeps the row
 * uniform (a text pill made the two controls look like different widgets), and the code
 * keeps the state readable, which an icon-only button cannot do. The dropdown lists every
 * entry in `SUPPORTED_LOCALES` with its full native name and a checked item, so the
 * control scales past two languages without changing shape.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LANGUAGE_CODES, LANGUAGE_NAMES, SUPPORTED_LOCALES, currentLocale, setLocale } from '@/i18n'

const { t } = useI18n()

/** The active language as a one-glyph code, so the square never grows. */
const currentCode = computed(() => LANGUAGE_CODES[currentLocale.value])

/** Full name for the accessible label — the code alone is not a readable name. */
const currentName = computed(() => LANGUAGE_NAMES[currentLocale.value])

function handleChange(value: unknown): void {
  if (typeof value === 'string') void setLocale(value)
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <button
        type="button"
        class="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-border bg-transparent text-[11px] font-emphasis text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :aria-label="`${t('header.language')}: ${currentName}`"
        :title="`${t('header.language')}: ${currentName}`"
        data-testid="language-menu"
      >
        <span data-testid="language-current">{{ currentCode }}</span>
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-40">
      <DropdownMenuLabel>{{ t('header.language') }}</DropdownMenuLabel>
      <DropdownMenuRadioGroup :model-value="currentLocale" @update:model-value="handleChange">
        <DropdownMenuRadioItem v-for="locale in SUPPORTED_LOCALES" :key="locale" :value="locale">
          {{ LANGUAGE_NAMES[locale] }}
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
