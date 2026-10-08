<script setup lang="ts">
/**
 * The pricing band — the page's two ways to run the same software, side by side.
 *
 * One is free forever (self-hosting the whole system), the other is a hosted service whose price is
 * not set yet; the section states both plainly and lets the data say the rest. No figure is written
 * here — `pricing-plans.ts` is the single source, and that is the whole point of this band: the
 * business can set a price by editing one file.
 */
import PricingTable from './PricingTable.vue'
import { PRICING_PLANS } from './pricing-plans'
</script>

<template>
  <div class="flex flex-col gap-8">
    <header class="flex flex-col gap-3">
      <h2 class="text-heading-2">Two ways to run it</h2>
      <p class="max-w-[52rem] text-sm leading-relaxed text-muted-foreground">
        The software is yours either way — every feature, all three repositories. Run it yourself for free, or let the
        project run the sync server for you once that service ships.
      </p>
    </header>

    <PricingTable :plans="PRICING_PLANS" />
  </div>
</template>
