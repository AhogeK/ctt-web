<script setup lang="ts">
import { SidebarTrigger } from '@/components/ui/sidebar'

/**
 * AppHeader - Sticky header with sidebar trigger
 *
 * Desktop: Shows sidebar collapse button
 * Mobile: Shows hamburger menu to open drawer
 */
</script>

<template>
  <header class="sticky top-0 z-40 h-14 flex items-center gap-4 border-b bg-background px-4">
    <SidebarTrigger />
  </header>
</template>
