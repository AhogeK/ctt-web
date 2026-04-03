<script setup lang="ts">
import type { VNode } from 'vue'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import AppSidebar from '@/components/app/AppSidebar.vue'
import AppHeader from '@/components/app/AppHeader.vue'

/**
 * AppLayout - Main application shell with responsive sidebar
 *
 * Desktop: Fixed sidebar with collapsible support
 * Mobile (<=768px): Sheet drawer triggered by hamburger menu
 *
 * Slots:
 * - default: Main content area
 * - charts: Optional section for dashboard visualizations
 */
defineSlots<{
  default(): VNode[]
  charts?(): VNode[]
}>()
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <AppHeader />

      <!-- Charts slot (conditional) -->
      <section v-if="$slots.charts" class="bg-muted/30 p-4">
        <slot name="charts" />
      </section>

      <!-- Main content -->
      <main class="flex-1 p-4">
        <slot />
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>
