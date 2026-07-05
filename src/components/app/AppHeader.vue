<script setup lang="ts">
import { ref, computed } from 'vue'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { LogOut, Loader2, Sun, Moon, Monitor } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'
import UserAvatar from './UserAvatar.vue'

/**
 * AppHeader - Sticky header with user avatar menu
 *
 * Desktop: collapse toggle lives in the sidebar header (see AppSidebar);
 *          only the user avatar dropdown is exposed here.
 * Mobile:  sidebar renders inside a Sheet/Dialog overlay whose internal
 *          SidebarHeader is unreachable while closed, so we expose the
 *          SidebarTrigger here as the only way to open the sidebar.
 */
const authStore = useAuthStore()
const { isMobile } = useSidebar()
const isLoggingOut = ref(false)

/**
 * Display info shown in the dropdown header.
 *
 * Both fields gracefully fall back when the user profile has not been
 * fetched yet (e.g. immediately after login, before fetchUserProfile
 * resolves):
 * - displayName → "User" so the dropdown is never empty
 * - email → hidden when empty (v-if on the span below) so the layout
 *   collapses cleanly for accounts without an email on file
 */
const displayName = computed(() => authStore.displayName ?? 'User')
const displayEmail = computed(() => authStore.email ?? '')

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
    <SidebarTrigger v-if="isMobile" class="h-9 w-9" />
    <div class="ml-auto flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger as-child>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <button
                  type="button"
                  :aria-label="`Open user menu`"
                  class="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <UserAvatar />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" class="w-56">
                <DropdownMenuLabel>
                  <div class="flex flex-col gap-1">
                    <span class="font-medium">{{ displayName }}</span>
                    <span v-if="displayEmail" class="text-xs text-muted-foreground">{{ displayEmail }}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem :disabled="isLoggingOut" @select="handleLogout">
                  <Loader2 v-if="isLoggingOut" class="mr-2 h-4 w-4 animate-spin" />
                  <LogOut v-else class="mr-2 h-4 w-4" />
                  <span>{{ isLoggingOut ? 'Logging out...' : 'Logout' }}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipTrigger>
          <TooltipContent v-if="authStore.displayName">{{ displayName }}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  </header>
</template>
