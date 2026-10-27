<script setup lang="ts">
/**
 * Root application component.
 * Provides global error handling via ErrorBoundary wrapper,
 * toast notification system via Sonner Toaster,
 * and handles route rendering through Vue Router.
 * Initializes theme to follow system preference on mount.
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import ErrorBoundary from '@/components/app/ErrorBoundary.vue'
import { Toaster } from '@/components/ui/sonner'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import { TERMS_EXPIRED_EVENT, resolveTermsQueue, rejectTermsQueue } from '@/lib/api/instance'
import TermsDialog from '@/features/auth/components/TermsDialog.vue'
import { RouteNames } from '@/router/route-names'
import { resolvePostAuthTarget } from '@/router/post-auth-redirect'

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()
const isTermsDialogOpen = ref(false)
const isLoginTimeTermsExpired = ref(false)

function handleTermsExpired() {
  // Track if this happened during login (user on auth pages or OAuth callback)
  const currentRoute = router.currentRoute.value
  isLoginTimeTermsExpired.value =
    currentRoute.path.startsWith('/auth/') ||
    currentRoute.name === RouteNames.LOGIN ||
    currentRoute.name === RouteNames.OAUTH_CALLBACK
  isTermsDialogOpen.value = true
}

function handleTermsAccepted() {
  resolveTermsQueue()
  // Navigate to dashboard if terms expired during login
  if (isLoginTimeTermsExpired.value) {
    isLoginTimeTermsExpired.value = false
    router.push(
      resolvePostAuthTarget(router, router.currentRoute.value.query.redirect) ?? { name: RouteNames.DASHBOARD },
    )
  }
}

function handleTermsRejected() {
  rejectTermsQueue()
  isLoginTimeTermsExpired.value = false
  // Clear auth state and redirect to login
  authStore.clearAuth()
  router.push({ name: RouteNames.LOGIN })
  toast.error(t('app.termsRequired'))
}

// Initialize theme to follow system preference
onMounted(() => {
  // Adopts the system preference only when no theme has been chosen yet — see `initTheme`.
  useThemeStore().initTheme()
  globalThis.addEventListener(TERMS_EXPIRED_EVENT, handleTermsExpired)
  globalThis.addEventListener('chunk-load-failed', handleChunkLoadFailed)
})

onUnmounted(() => {
  globalThis.removeEventListener(TERMS_EXPIRED_EVENT, handleTermsExpired)
  globalThis.removeEventListener('chunk-load-failed', handleChunkLoadFailed)
})

/**
 * Chunk load retry failed even after a hard reload — the view would stay
 * blank with only a console error. Surface a toast with a manual retry
 * action so the user can recover without guessing.
 */
function handleChunkLoadFailed() {
  toast.error(t('app.chunkLoadFailed'), {
    action: {
      label: t('app.retry'),
      onClick: () => globalThis.location.reload(),
    },
    duration: Number.POSITIVE_INFINITY,
  })
}
</script>

<template>
  <ErrorBoundary>
    <RouterView v-slot="{ Component }">
      <template v-if="Component">
        <Suspense>
          <!-- Route content (async chunks resolve before paint) -->
          <component :is="Component" />
          <!-- Fallback: chunk still loading — skeleton, never blank -->
          <template #fallback>
            <div class="flex min-h-[50vh] flex-col items-center justify-center gap-3" data-testid="route-loading">
              <div class="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
              <p class="text-sm text-muted-foreground">{{ t('app.loading') }}</p>
            </div>
          </template>
        </Suspense>
      </template>
    </RouterView>
  </ErrorBoundary>
  <Toaster position="top-right" :expand="true" rich-colors />
  <TermsDialog
    v-if="isTermsDialogOpen"
    v-model:open="isTermsDialogOpen"
    @accepted="handleTermsAccepted"
    @rejected="handleTermsRejected"
  />
</template>
