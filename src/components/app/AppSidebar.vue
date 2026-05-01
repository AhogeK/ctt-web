<script setup lang="ts">
import { ref } from 'vue'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { RouterLink } from 'vue-router'
import { LayoutDashboard, Settings, Monitor, LogOut, Loader2 } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

/**
 * AppSidebar - Navigation sidebar for application pages
 *
 * Displays navigation links for dashboard, devices, settings, etc.
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
  <Sidebar>
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg">
            <span class="font-semibold">CTT</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Navigation</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <RouterLink to="/dashboard">
                  <LayoutDashboard class="h-4 w-4" />
                  <span>Dashboard</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <RouterLink to="/devices">
                  <Monitor class="h-4 w-4" />
                  <span>Devices</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>Settings</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <RouterLink to="/settings/profile">
                  <Settings class="h-4 w-4" />
                  <span>Profile</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <Button
            variant="ghost"
            class="w-full justify-start text-secondary-foreground hover:text-foreground"
            :disabled="isLoggingOut"
            @click="handleLogout"
          >
            <Loader2 v-if="isLoggingOut" class="h-4 w-4 animate-spin" />
            <LogOut v-else class="h-4 w-4" />
            <span>{{ isLoggingOut ? 'Logging out...' : 'Logout' }}</span>
          </Button>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  </Sidebar>
</template>
