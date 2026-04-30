<script setup lang="ts">
import { ref } from 'vue'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { LogOut, Loader2 } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

/**
 * AppHeader - Sticky header with sidebar trigger and logout button
 *
 * Desktop: Shows sidebar collapse button on left, logout on right
 * Mobile: Shows hamburger menu to open drawer
 */

const authStore = useAuthStore()
const isLoggingOut = ref(false)

/**
 * Handles logout button click.
 * Prevents double-click via loading state guard.
 * Calls authStore.logout() which clears tokens and redirects to login.
 */
async function handleLogout(): Promise<void> {
  if (isLoggingOut.value) return

  isLoggingOut.value = true
  try {
    await authStore.logout()
  } finally {
    isLoggingOut.value = false
  }
}
</script>

<template>
  <header class="sticky top-0 z-40 h-14 flex items-center gap-4 border-b bg-background px-4">
    <SidebarTrigger />
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            variant="ghost"
            size="icon"
            class="ml-auto"
            :disabled="isLoggingOut"
            :aria-label="isLoggingOut ? 'Logging out...' : 'Logout'"
            @click="handleLogout"
          >
            <Loader2 v-if="isLoggingOut" class="h-4 w-4 animate-spin" />
            <LogOut v-else class="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {{ isLoggingOut ? 'Logging out...' : 'Logout' }}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </header>
</template>
