<script setup lang="ts">
/**
 * The capability list — what the product does beyond the dashboard's charts.
 *
 * One claim plus one concrete consequence per item: a number without a checkable source says
 * nothing. All four numbers are the product's own — the 24 boards are the leaderboard contract's
 * seven rankings across the periods each one supports, the 67 badges across 14 ladders are the
 * achievements contract, convergence is the sync engine's last-write-wins, and the devices and keys
 * surfaces are pages of this dashboard.
 */
const ITEMS = [
  {
    title: '24 boards, every one real.',
    body: 'Seven measures — total time, streak, night owl, early bird, growth, active days and per language — each offered only for the windows it actually supports, so the period picker cannot offer a combination that does not exist.',
  },
  {
    title: '67 badges across 14 ladders.',
    body: 'Every achievement is a ladder: the card shows the current rung, the next one and the distance between — and the resetting ladders count the periods you have reached them in.',
  },
  {
    title: 'Sync that converges.',
    body: 'Bind each machine with its own API key; concurrent edits resolve last-write-wins, a delete always beats an edit, and every device ends on the same version of a session.',
  },
  {
    title: 'Devices and keys, in plain sight.',
    body: 'The devices page lists every machine that has synced and when; keys carry their scope, status and last use — and either can be revoked from the dashboard.',
  },
] as const
</script>

<template>
  <div class="flex flex-col gap-8">
    <header class="flex flex-col gap-3">
      <h2 class="text-heading-2">Ranks, trophies, devices and keys</h2>
      <p class="max-w-[52rem] text-sm leading-relaxed text-muted-foreground">
        The charts are one view of your sessions. The other four are these — every one built from the same data, in this
        repository.
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
