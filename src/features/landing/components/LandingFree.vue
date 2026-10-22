<script setup lang="ts">
/**
 * The free band — what the system costs, and how to run it.
 *
 * The page states it plainly: every part is free and open source. `run-options.ts` is the single
 * source for the two ways to run the system, and the support channels come from the same list the
 * footer and the plugin use — so a change of copy or of channel is a data edit.
 */
import { SUPPORT_CHANNELS } from '@/lib/site-links'
import RunOptions from './RunOptions.vue'
import { buildRunOptions } from './run-options'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const RUN_OPTIONS = computed(() => buildRunOptions((key) => t(key)))
</script>

<template>
  <div class="flex flex-col gap-8">
    <header class="flex flex-col gap-3">
      <h2 class="text-heading-2">{{ t('landing.free.title') }}</h2>
      <p class="max-w-[52rem] text-sm leading-relaxed text-muted-foreground">
        {{ t('landing.free.lead') }}
      </p>
    </header>

    <RunOptions :options="RUN_OPTIONS" />

    <div class="flex flex-col gap-2 border-t border-border/60 pt-6" data-testid="landing-support">
      <h3 class="text-heading-3">{{ t('landing.free.supportTitle') }}</h3>
      <p class="max-w-[52rem] text-sm leading-relaxed text-muted-foreground">
        {{ t('landing.free.supportLead') }}
        <template v-for="(channel, index) in SUPPORT_CHANNELS" :key="channel.id">
          <a
            :href="channel.url"
            target="_blank"
            rel="noopener noreferrer"
            class="rounded-sm font-emphasis text-foreground underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >{{ channel.label }}</a
          ><span v-if="index < SUPPORT_CHANNELS.length - 1" aria-hidden="true"> · </span>
        </template>
        . {{ t('landing.free.supportTail') }}
      </p>
    </div>
  </div>
</template>
