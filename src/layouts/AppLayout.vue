<script setup lang="ts">
import type { VNode } from 'vue'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import AppSidebar from '@/components/app/AppSidebar.vue'
import AppHeader from '@/components/app/AppHeader.vue'
import ErrorBoundary from '@/components/app/ErrorBoundary.vue'

/**
 * AppLayout - Main application shell with responsive sidebar and error protection
 *
 * Desktop: Fixed sidebar with collapsible support
 * Mobile (<=768px): Sheet drawer triggered by hamburger menu
 *
 * Error Handling:
 * - Main content wrapped in ErrorBoundary to prevent white-screen crashes
 * - Sidebar and header remain functional even if page component fails
 * - Charts slot remains outside boundary (optional, non-critical)
 *
 * Slots:
 * - default: Main content area (protected by ErrorBoundary)
 * - charts: Optional section for dashboard visualizations (unprotected)
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

      <!-- Charts slot (conditional, outside ErrorBoundary) -->
      <section v-if="$slots.charts" class="bg-muted/30 p-4">
        <slot name="charts" />
      </section>

      <!-- Main content (protected by ErrorBoundary) -->
      <main class="flex-1 p-4">
        <ErrorBoundary>
          <slot />
        </ErrorBoundary>
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>
