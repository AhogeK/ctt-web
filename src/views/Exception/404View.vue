<script setup lang="ts">
/**
 * 404 Not Found view component.
 * Provides user-friendly navigation options when a route is not found.
 */
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { RouteNames } from '@/router/route-names'

const router = useRouter()

/**
 * Navigate to the home page using type-safe route name.
 */
function handleGoHome() {
  router.push({ name: RouteNames.HOME })
}

/**
 * Navigate back to the previous page in browser history.
 */
function handleGoBack() {
  router.back()
}
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-background px-4">
    <div class="text-center">
      <!-- Large decorative 404 number -->
      <h1 class="text-8xl font-bold text-primary/20">404</h1>

      <!-- Page title -->
      <h2 class="mt-4 text-3xl font-bold text-foreground">Page Not Found</h2>

      <!-- Helpful description -->
      <p class="mt-4 max-w-md text-muted-foreground">
        The page you are looking for does not exist or has been removed. Please check the URL or use the buttons below
        to return to a valid page.
      </p>

      <!-- Action buttons -->
      <div class="mt-8 flex justify-center flex-col gap-3 sm:flex-row sm:gap-4">
        <Button variant="default" @click="handleGoHome"> Go Home </Button>
        <Button variant="outline" @click="handleGoBack"> Go Back </Button>
      </div>
    </div>
  </div>
</template>
