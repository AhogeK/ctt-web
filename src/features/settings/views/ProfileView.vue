<script setup lang="ts">
/**
 * Profile settings view component.
 * Displays user profile information and account management options.
 */
import { toast } from 'vue-sonner'
import { useMutation } from '@tanstack/vue-query'
import { getGitHubAuthorizeUrl } from '@/lib/api/auth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const githubMutation = useMutation({
  mutationFn: getGitHubAuthorizeUrl,
  onSuccess: (data) => {
    window.location.href = data.authUrl
  },
  onError: () => {
    toast.error('GitHub linking failed', { description: 'Unable to start GitHub authorization. Please try again.' })
  },
})

function handleBindGitHub() {
  githubMutation.mutate()
}
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
          <svg class="h-6 w-6" viewBox="0 0 16 16" fill="currentColor">
            <path
              d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
            />
          </svg>
          <div>
            <p class="font-medium text-gray-900 dark:text-[#f7f8f8]">GitHub</p>
            <p class="text-sm text-gray-500 dark:text-[#8a8f98]">Not connected</p>
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
