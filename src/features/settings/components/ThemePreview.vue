<script setup lang="ts">
/**
 * A miniature product frame used by the theme choices.
 *
 * The colours are fixed specimens, not the page's live tokens: the Light tile
 * must stay light while the page is dark, and the System tile must show both
 * sides at once. The frame carries no text, so it is decorative for assistive
 * technology and the radio's own label supplies the name.
 */
import { computed } from 'vue'

type Tone = 'light' | 'dark'

const props = defineProps<{
  variant: 'system' | 'light' | 'dark'
}>()

const tones = computed<Tone[]>(() => (props.variant === 'system' ? ['light', 'dark'] : [props.variant]))
</script>

<template>
  <div
    aria-hidden="true"
    class="grid h-[92px] w-full overflow-hidden"
    :class="tones.length === 2 ? 'grid-cols-2 gap-px bg-border' : ''"
  >
    <div
      v-for="tone in tones"
      :key="tone"
      class="flex min-w-0 flex-col"
      :class="tone === 'dark' ? 'bg-[#0b0c10] text-[#f7f8f8]' : 'bg-[#f7f8f8] text-[#08090a]'"
    >
      <div
        class="flex h-5 shrink-0 items-center gap-1 border-b px-2"
        :class="tone === 'dark' ? 'border-white/10' : 'border-black/10'"
      >
        <span class="size-1 rounded-full bg-current opacity-20" />
        <span class="size-1 rounded-full bg-current opacity-20" />
        <span class="size-1 rounded-full bg-current opacity-20" />
        <span class="ml-auto h-1 w-6 rounded-full bg-current opacity-10" />
      </div>

      <div class="grid flex-1 grid-cols-[1fr_1.55fr] gap-1.5 p-2">
        <div class="flex min-w-0 flex-col gap-1.5">
          <span class="h-1.5 w-4/5 rounded-full bg-current opacity-10" />
          <span class="h-1.5 w-3/5 rounded-full bg-current opacity-10" />
          <span class="h-1.5 w-full rounded-full bg-current opacity-10" />
          <span class="mt-auto h-1.5 w-2/3 rounded-full bg-[#5e6ad2] opacity-45" />
        </div>

        <div class="min-w-0 rounded border p-1.5" :class="tone === 'dark' ? 'border-white/10' : 'border-black/10'">
          <span class="block h-2 w-7 rounded-sm bg-[#5e6ad2] opacity-55" />
          <span class="mt-1.5 block h-1 w-full rounded-full bg-current opacity-10" />
          <span class="mt-1 block h-1 w-3/4 rounded-full bg-current opacity-10" />
          <span class="mt-3 block h-1 w-1/2 rounded-full bg-current opacity-10" />
        </div>
      </div>
    </div>
  </div>
</template>
