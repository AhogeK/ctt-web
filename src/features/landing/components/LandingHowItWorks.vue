<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * The pipeline in the order the data travels — record on the machine, push to a server you host,
 * read it back here. The order is the information, so the list is numbered; each step is replaceable
 * on its own (the plugin tracks locally with no account, and the server is what makes this dashboard
 * possible).
 */
const { t } = useI18n()

const STEPS = computed(() => [
  { title: t('landing.howItWorks.recordTitle'), body: t('landing.howItWorks.recordBody') },
  { title: t('landing.howItWorks.syncTitle'), body: t('landing.howItWorks.syncBody') },
  { title: t('landing.howItWorks.readTitle'), body: t('landing.howItWorks.readBody') },
])
</script>

<template>
  <div class="flex flex-col gap-8">
    <header class="flex flex-col gap-3">
      <h2 class="text-heading-2">{{ t('landing.howItWorks.title') }}</h2>
      <p class="max-w-[52rem] text-sm leading-relaxed text-muted-foreground">
        {{ t('landing.howItWorks.lead') }}
      </p>
    </header>

    <ol class="grid gap-6 md:grid-cols-3 md:gap-8">
      <li v-for="(step, index) in STEPS" :key="step.title" class="flex flex-col gap-2 border-t border-border/60 pt-4">
        <span class="font-mono text-xs text-muted-foreground">{{ index + 1 }}</span>
        <h3 class="text-heading-3">{{ step.title }}</h3>
        <p class="text-sm leading-relaxed text-muted-foreground">{{ step.body }}</p>
      </li>
    </ol>
  </div>
</template>
