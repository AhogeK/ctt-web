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
      <h2 class="mt-4 text-3xl font-bold text-foreground">页面未找到</h2>

      <!-- Helpful description -->
      <p class="mt-4 max-w-md text-muted-foreground">
        您访问的页面不存在或已被移除。请检查链接是否正确，或使用下方按钮返回有效页面。
      </p>

      <!-- Action buttons -->
      <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
        <Button variant="default" @click="handleGoHome"> 返回首页 </Button>
        <Button variant="outline" @click="handleGoBack"> 返回上一页 </Button>
      </div>
    </div>
  </div>
</template>
