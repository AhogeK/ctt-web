<script setup lang="ts">
import { ref } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ECOSYSTEM_REPOS } from '@/lib/site-links'

/**
 * The ecosystem, as a dialog.
 *
 * A dialog rather than a scroll to the footer catalogue: the landing page's scroll drives the stage,
 * so an animated pass replays the pinned stretches on the way, and an instant jump loses the sense
 * of travel. The footer list stays in place as the page's own catalogue - the trigger is a real
 * anchor to it, so the entry still works without JavaScript.
 */
const open = ref(false)
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <slot />
    </DialogTrigger>

    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Source repositories</DialogTitle>
        <DialogDescription>
          Three repositories make up the tracker: the plugin that records, the backend that stores, and this dashboard
          that reads.
        </DialogDescription>
      </DialogHeader>

      <ul class="flex flex-col gap-1">
        <li v-for="repo in ECOSYSTEM_REPOS" :key="repo.url">
          <a
            :href="repo.url"
            target="_blank"
            rel="noopener noreferrer"
            class="flex flex-col gap-0.5 rounded-md px-3 py-2.5 transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <span class="font-medium">{{ repo.name }}</span>
            <span class="text-sm text-muted-foreground">{{ repo.role }}</span>
          </a>
        </li>
      </ul>
    </DialogContent>
  </Dialog>
</template>
