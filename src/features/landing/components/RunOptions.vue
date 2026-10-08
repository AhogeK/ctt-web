<script setup lang="ts">
/**
 * Renders the ways to run the system — the presentation half of the free band.
 *
 * It carries no cost of its own: every name, label, feature and call to action comes from the
 * `options` prop (the landing page passes `RUN_OPTIONS`). An entry whose cost kind is `status`
 * renders that status where a figure would sit and never grows a purchase button, so the page
 * cannot imply something is for sale.
 */
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { RunOption } from './run-options'

interface Props {
  /** The entries to render, in order. */
  options: readonly RunOption[]
}

const props = defineProps<Props>()
</script>

<template>
  <div class="grid gap-6 md:grid-cols-2" data-testid="run-options">
    <article
      v-for="option in props.options"
      :key="option.id"
      class="flex flex-col gap-4 rounded-xl border border-border/60 p-6"
      data-surface="card"
      :data-testid="`run-option-${option.id}`"
    >
      <header class="flex flex-col gap-1">
        <h3 class="text-heading-3">{{ option.name }}</h3>
        <p class="text-sm leading-relaxed text-muted-foreground">{{ option.tagline }}</p>
      </header>

      <p v-if="option.cost.kind === 'free'" class="text-2xl font-semibold tracking-tight" data-testid="run-option-cost">
        {{ option.cost.label }}
      </p>
      <div v-else class="flex flex-wrap items-center gap-2" data-testid="run-option-status">
        <Badge variant="outline" class="border-border text-muted-foreground">{{ option.cost.label }}</Badge>
      </div>

      <ul class="flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed text-muted-foreground">
        <li v-for="feature in option.features" :key="feature">{{ feature }}</li>
      </ul>

      <div v-if="option.cta" class="mt-auto pt-2">
        <Button as-child variant="outline" size="sm">
          <a :href="option.cta.href">{{ option.cta.label }}</a>
        </Button>
      </div>
    </article>
  </div>
</template>
