<script setup lang="ts">
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
import { RouterLink } from 'vue-router'
import { LayoutDashboard, Settings, Monitor } from 'lucide-vue-next'

/**
 * AppSidebar - Navigation sidebar for application pages
 *
 * Displays navigation links for dashboard, devices, settings, etc.
 */
</script>

<template>
  <Sidebar>
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <div class="flex items-center gap-2 px-2 py-1.5">
            <span class="text-sm font-semibold">Code Time Tracker</span>
          </div>
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
      <div class="px-2 py-1.5 text-xs text-muted-foreground">© 2026 AhogeK</div>
    </SidebarFooter>
  </Sidebar>
</template>
