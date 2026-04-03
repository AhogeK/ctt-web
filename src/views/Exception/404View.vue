<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-background">
    <div class="text-center">
      <h1 class="text-6xl font-bold text-foreground">404</h1>
      <p class="mt-4 text-lg text-muted-foreground">Page not found</p>
      <RouterLink
        to="/"
        class="mt-8 inline-flex items-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Back to Home
      </RouterLink>
    </div>
  </div>
</template>
