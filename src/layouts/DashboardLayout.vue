<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

/**
 * Dashboard layout with sidebar, header, and chart area.
 * Extends DefaultLayout with dedicated space for data visualizations.
 */
const props = defineProps<{
  /** Additional classes for the layout container */
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div data-slot="dashboard-layout" :class="cn('min-h-screen bg-background', props.class)">
    <!-- Sidebar placeholder -->
    <aside data-slot="sidebar" class="fixed inset-y-0 left-0 z-50 w-64 border-r bg-sidebar">
      <div class="flex h-full flex-col">
        <div class="flex h-14 items-center border-b px-4">
          <span class="text-sidebar-foreground font-semibold">Sidebar</span>
        </div>
        <div class="flex-1 overflow-auto p-4">
          <slot name="sidebar" />
        </div>
      </div>
    </aside>

    <!-- Main content area with header and chart section -->
    <div class="pl-64">
      <!-- Header placeholder -->
      <header data-slot="header" class="sticky top-0 z-40 h-14 border-b bg-background">
        <div class="flex h-full items-center justify-between px-6">
          <slot name="header" />
        </div>
      </header>

      <!-- Chart area placeholder -->
      <section data-slot="charts" class="border-b bg-muted/30 p-6">
        <div class="grid gap-6">
          <slot name="charts" />
        </div>
      </section>

      <!-- Main content -->
      <main data-slot="main" class="flex-1 p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
