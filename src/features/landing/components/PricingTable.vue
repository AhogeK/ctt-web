<script setup lang="ts">
/**
 * Renders the pricing entries — the presentation half of the section.
 *
 * It has no prices of its own: every name, price label, feature and call to action comes from the
 * `plans` prop (the landing page passes `PRICING_PLANS`). An `in-design` entry renders its status
 * where a figure would sit and never grows a purchase button, so the page cannot imply something is
 * for sale before it is.
 */
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { PricingPlan } from './pricing-plans'

interface Props {
  /** The entries to render, in order. */
  plans: readonly PricingPlan[]
}

const props = defineProps<Props>()
</script>

<template>
  <div class="grid gap-6 md:grid-cols-2" data-testid="pricing-plans">
    <article
      v-for="plan in props.plans"
      :key="plan.id"
      class="flex flex-col gap-4 rounded-xl border border-border/60 p-6"
      data-surface="card"
      :data-testid="`pricing-plan-${plan.id}`"
    >
      <header class="flex flex-col gap-1">
        <h3 class="text-heading-3">{{ plan.name }}</h3>
        <p class="text-sm leading-relaxed text-muted-foreground">{{ plan.tagline }}</p>
      </header>

      <p v-if="plan.price.kind === 'free'" class="text-2xl font-semibold tracking-tight" data-testid="pricing-price">
        {{ plan.price.label }}
      </p>
      <div v-else class="flex flex-wrap items-center gap-2" data-testid="pricing-status">
        <Badge variant="outline" class="border-border text-muted-foreground">{{ plan.price.label }}</Badge>
        <span class="text-sm text-muted-foreground">No price yet — it will be published here first.</span>
      </div>

      <ul class="flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed text-muted-foreground">
        <li v-for="feature in plan.features" :key="feature">{{ feature }}</li>
      </ul>

      <div v-if="plan.cta" class="mt-auto pt-2">
        <Button as-child variant="outline" size="sm">
          <a :href="plan.cta.href">{{ plan.cta.label }}</a>
        </Button>
      </div>
    </article>
  </div>
</template>
