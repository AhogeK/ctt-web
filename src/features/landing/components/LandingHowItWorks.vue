<script setup lang="ts">
/**
 * The pipeline in the order the data travels — record on the machine, push to a server you host,
 * read it back here. The order is the information, so the list is numbered; each step is replaceable
 * on its own (the plugin tracks locally with no account, and the server is what makes this dashboard
 * possible).
 */
const STEPS = [
  {
    title: 'Record.',
    body: 'The JetBrains plugin catches keyboard and mouse activity with idle detection and writes each session to a local SQLite file. Nothing leaves the machine until you switch sync on.',
  },
  {
    title: 'Sync.',
    body: 'Bind the machine with an API key and it pushes to a ctt-server you host — PostgreSQL for the sessions, Redis for the boards. Conflicts resolve last-write-wins.',
  },
  {
    title: 'Read.',
    body: 'This dashboard queries that server for the stats, boards and trophies. The examples above render the same components over sample data.',
  },
] as const
</script>

<template>
  <div class="flex flex-col gap-8">
    <header class="flex flex-col gap-3">
      <h2 class="text-heading-2">How it works</h2>
      <p class="max-w-[52rem] text-sm leading-relaxed text-muted-foreground">
        Three pieces in a straight line. Each is replaceable on its own — start with the plugin alone, and add the
        server when you want this dashboard.
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
