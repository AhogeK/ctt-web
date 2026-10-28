<script setup lang="ts">
/**
 * A note that states how this page relates to a sibling page of the settings group, and a link to it.
 *
 * An API key is what the plugin signs in with, and a device is the plugin that signs in, so
 * neither page reads on its own. Each of them says the relation once, under its own heading, and
 * the other one — the link is a separate line rather than part of the sentence, so the sentence
 * stays a sentence in every language.
 */
import { ArrowRight } from '@lucide/vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'

defineProps<{
  /** The sibling page's route. */
  to: RouteLocationRaw
  /** The sibling page's name, as it reads in the link. */
  label: string
}>()
</script>

<template>
  <div data-testid="settings-relation-note" class="flex flex-col gap-1">
    <p class="text-sm text-muted-foreground">
      <slot />
    </p>
    <RouterLink
      :to="to"
      class="flex w-fit items-center gap-1 text-sm font-medium text-foreground underline underline-offset-2 transition-colors hover:text-primary"
    >
      {{ label }}
      <ArrowRight class="h-3.5 w-3.5 shrink-0" />
    </RouterLink>
  </div>
</template>
