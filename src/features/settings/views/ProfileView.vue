<script setup lang="ts">
/**
 * Profile settings view component.
 * Displays user profile information and account management options.
 */
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'
import { getGitHubAuthorizeUrl, fetchLinkedOAuthAccounts } from '@/lib/api'
import { getOAuthBindErrorMessage } from '@/lib/errors/oauth-bind-error-messages'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { OAuthAccountBinding } from '@/lib/schemas/oauth-account.schema'

const route = useRoute()
const router = useRouter()

const githubMutation = useMutation({
  // Action 'bind' links the GitHub account to the currently authenticated user.
  // The literal parameter type is required so TanStack Query infers
  // TVariables = 'bind' (otherwise it would infer TVariables = void and
  // reject the corresponding mutate('bind') call).
  mutationFn: (_action: 'bind') => getGitHubAuthorizeUrl('bind'),
  onSuccess: (data) => {
    globalThis.location.href = data.authUrl
  },
  onError: (error) => {
    // AUTH_001 means the apiFetch interceptor (instance.ts) is already
    // clearing auth state and redirecting to /login. Showing our own
    // toast on top would race with the redirect and confuse the user.
    const code = (error as { data?: { code?: string } })?.data?.code
    if (code === 'AUTH_001') return

    toast.error('GitHub linking failed', { description: 'Unable to start GitHub authorization. Please try again.' })
  },
})

const {
  data: oauthAccounts,
  isPending: isAccountsPending,
  isError: isAccountsError,
  refetch: refetchOAuthAccounts,
} = useQuery({
  queryKey: ['oauth-accounts'],
  queryFn: ({ signal }) => fetchLinkedOAuthAccounts(signal),
  // 30s fresh window — aligns with global default but made explicit so
  // a future global change cannot silently break the binding-status UX.
  staleTime: 30 * 1000,
  // Refetch when the user returns to the tab so newly linked accounts
  // show up without a hard reload (e.g. after OAuth callback).
  refetchOnWindowFocus: true,
})

function handleBindGitHub() {
  // Pass 'bind' as the mutate variable so TanStack Query forwards it to
  // mutationFn; semantically this selects the BIND flow at the backend.
  githubMutation.mutate('bind')
}

function handleRetryLoad() {
  void refetchOAuthAccounts()
}

/**
 * Resolves the display label for a single OAuth binding, preferring the
 * provider login handle and falling back to the email when unavailable.
 * Returns null when neither field is set, so the caller can show a
 * generic "Connected" state.
 */
function getBindingLabel(binding: OAuthAccountBinding): string | null {
  if (binding.providerLogin) return binding.providerLogin
  if (binding.providerEmail) return binding.providerEmail
  return null
}

interface ProviderDisplay {
  icon: 'github' | 'unknown'
  label: string
}

function getProviderDisplay(provider: string): ProviderDisplay {
  if (provider === 'github') {
    return { icon: 'github', label: 'GitHub' }
  }
  return { icon: 'unknown', label: provider }
}

const providerDisplay = computed<ProviderDisplay>(() => getProviderDisplay('github'))

const githubBinding = computed<OAuthAccountBinding | null>(() => {
  const accounts = oauthAccounts.value?.accounts
  if (!accounts) return null
  return accounts.find((a) => a.provider === 'github') ?? null
})

/**
 * Handles the OAuth BIND callback when GitHub redirects back to
 * /settings/profile?linked=github (success) or
 * /settings/profile?linked=github&error={code} (failure).
 *
 * The backend always hardcodes the redirect URL — no other path is possible.
 * We use onMounted (not a persistent watcher) because the OAuth callback
 * always results in a full page navigation, which remounts the component.
 */
onMounted(() => {
  // Vue Router types LocationQueryValue as string | null | (string | null)[].
  // The backend hardcodes a single-value query, but normalize defensively
  // so a hostile or buggy redirect can't smuggle a malformed payload.
  const linkedParam = Array.isArray(route.query.linked) ? route.query.linked[0] : route.query.linked
  if (linkedParam !== 'github') return

  const errorParam = Array.isArray(route.query.error) ? route.query.error[0] : route.query.error

  // Empty-string error (?linked=github&error=) would otherwise fall into
  // the truthy check and silently toast success on a failed bind.
  if (typeof errorParam === 'string' && errorParam.length > 0) {
    const message = getOAuthBindErrorMessage(errorParam)
    toast.error('GitHub linking failed', { description: message })
  } else {
    toast.success('GitHub account linked successfully')
    void refetchOAuthAccounts()
  }

  // Strip the query params so a page refresh does not re-trigger the toast
  router.replace({ query: {} }).catch(() => {
    // Navigation cancelled or failed; not critical for the bind flow UX
  })
})
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <div class="flex flex-col gap-2">
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-[#f7f8f8]">Profile Settings</h1>
      <p class="text-sm text-gray-500 dark:text-[#8a8f98]">Manage your account information</p>
    </div>

    <!-- Connected Accounts Section -->
    <div class="rounded-lg border border-gray-200 dark:border-white/8 bg-gray-50 dark:bg-white/2 p-6">
      <h2 class="text-lg font-medium text-gray-900 dark:text-[#f7f8f8] mb-4">Connected Accounts</h2>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <!-- Provider icon: GitHub SVG today; future providers should
               add their own case in getProviderDisplay and a matching
               SVG block here (or render an icon component). -->
          <svg v-if="providerDisplay.icon === 'github'" class="h-6 w-6" viewBox="0 0 16 16" fill="currentColor">
            <path
              d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
            />
          </svg>
          <svg
            v-else
            class="h-6 w-6"
            viewBox="0 0 24 24"
            fill="currentColor"
            role="img"
            :aria-label="providerDisplay.label"
          >
            <text x="12" y="17" text-anchor="middle" font-size="14" font-weight="500">
              {{ providerDisplay.label.slice(0, 1).toUpperCase() }}
            </text>
          </svg>
          <div>
            <p class="font-medium text-gray-900 dark:text-[#f7f8f8]">{{ providerDisplay.label }}</p>
            <p
              v-if="isAccountsPending"
              class="text-sm text-gray-500 dark:text-[#8a8f98]"
              data-testid="github-status-loading"
            >
              Checking connection…
            </p>
            <p
              v-else-if="isAccountsError"
              class="text-sm text-red-600 dark:text-red-400"
              data-testid="github-status-error"
            >
              Failed to load connection status
              <button
                type="button"
                class="ml-1 underline underline-offset-2 hover:text-red-700 dark:hover:text-red-300"
                data-testid="github-status-retry"
                @click="handleRetryLoad"
              >
                Retry
              </button>
            </p>
            <p
              v-else-if="githubBinding"
              class="text-sm text-gray-500 dark:text-[#8a8f98]"
              data-testid="github-status-connected"
            >
              <span class="text-green-600 dark:text-green-400">Connected</span>
              <template v-if="getBindingLabel(githubBinding)">
                <span> as </span>
                <span class="font-medium text-gray-900 dark:text-[#f7f8f8]">{{ getBindingLabel(githubBinding) }}</span>
              </template>
            </p>
            <p v-else class="text-sm text-gray-500 dark:text-[#8a8f98]" data-testid="github-status-disconnected">
              Not connected
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          :class="
            cn(
              'h-9 rounded-md font-[510] text-sm',
              'border-[#d0d6e0] bg-white text-[#1a1a2e]',
              'dark:border-white/8 dark:bg-white/2 dark:text-[#f7f8f8]',
              'transition-all duration-200',
              'hover:bg-[#f3f4f5] hover:border-[#5e6ad2]/50',
              'dark:hover:bg-white/5 dark:hover:border-[#7170ff]/50',
            )
          "
          :disabled="githubMutation.isPending.value"
          @click="handleBindGitHub"
        >
          {{ githubMutation.isPending.value ? 'Connecting...' : 'Connect GitHub' }}
        </Button>
      </div>
    </div>
  </div>
</template>
