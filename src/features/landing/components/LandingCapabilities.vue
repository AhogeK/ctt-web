<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * The capability list — what the product does beyond the dashboard's charts.
 *
 * One claim plus one concrete consequence per item: a number without a checkable source says
 * nothing. All four numbers are the product's own — the 24 boards are the leaderboard contract's
 * seven rankings across the periods each one supports, the 67 badges across 14 ladders are the
 * achievements contract, convergence is the sync engine's last-write-wins, and the devices and keys
 * surfaces are pages of this dashboard.
 */
const { t } = useI18n()

const ITEMS = computed(() => [
  { title: t('landing.capabilities.boardsTitle'), body: t('landing.capabilities.boardsBody') },
  { title: t('landing.capabilities.badgesTitle'), body: t('landing.capabilities.badgesBody') },
  { title: t('landing.capabilities.syncTitle'), body: t('landing.capabilities.syncBody') },
  { title: t('landing.capabilities.devicesTitle'), body: t('landing.capabilities.devicesBody') },
])
</script>

<template>
  <div class="flex flex-col gap-8">
    <header class="flex flex-col gap-3">
      <h2 class="text-heading-2">{{ t('landing.capabilities.title') }}</h2>
      <p class="max-w-[52rem] text-sm leading-relaxed text-muted-foreground">
        {{ t('landing.capabilities.lead') }}
      </p>
    </header>

    <div class="grid gap-x-8 gap-y-6 sm:grid-cols-2">
      <article v-for="item in ITEMS" :key="item.title" class="flex flex-col gap-2 border-t border-border/60 pt-4">
        <h3 class="text-heading-3">{{ item.title }}</h3>
        <p class="text-sm leading-relaxed text-muted-foreground">{{ item.body }}</p>
      </article>
    </div>
  </div>
</template>
