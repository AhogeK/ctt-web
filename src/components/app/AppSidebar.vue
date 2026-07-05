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
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { RouterLink } from 'vue-router'
import { LayoutDashboard, Monitor, User } from '@lucide/vue'
import PluginIcon from './PluginIcon.vue'

/**
 * AppSidebar - Navigation sidebar for application pages
 *
 * Header behavior:
 * - Desktop, expanded:  Plugin icon left, collapse trigger right
 * - Desktop, collapsed: Plugin icon centered, swaps to themed expand trigger on hover
 * - Mobile:             Header contents are hidden (sheet overlay owns its own close
 *                       affordance); the open trigger lives in AppHeader.
 */
const { state, isMobile } = useSidebar()
</script>

<template>
  <Sidebar collapsible="icon">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <!--
            Desktop only: the header chrome (icon + collapse trigger). On mobile
            the sidebar lives inside a Sheet/Dialog overlay, so we hide this row
            entirely — the open trigger is rendered in AppHeader.
          -->
          <div v-if="!isMobile && state !== 'collapsed'" class="flex w-full items-center justify-between">
            <PluginIcon class="h-7 w-7" />
            <SidebarTrigger class="h-7 w-7" />
          </div>

          <!--
            Collapsed: single icon cell (grid 1x1 stacks both in same cell).
            Plugin swaps to themed trigger on container hover; only one visible at a time.
            SidebarTrigger keeps its native click → toggleSidebar (no custom button needed).
            The opaque (visible) child gets pointer events; the opacity-0 child gets `pointer-events-none`
            so clicks always reach the trigger when it's visible.
          -->
          <div v-else class="group/trigger mx-auto grid h-9 w-9 place-items-center">
            <PluginIcon
              class="col-start-1 row-start-1 h-7 w-7 transition-opacity duration-150 group-hover/trigger:pointer-events-none group-hover/trigger:opacity-0"
            />
            <SidebarTrigger
              class="col-start-1 row-start-1 h-7 w-7 transition-opacity duration-150 opacity-0 pointer-events-none group-hover/trigger:pointer-events-auto group-hover/trigger:opacity-100"
            />
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel class="text-[11px] tracking-wider uppercase text-muted-foreground/70"
          >Navigation</SidebarGroupLabel
        >
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                as-child
                tooltip="Dashboard"
                class="h-9 text-[15px] [&>svg]:size-[18px] [&>svg]:mr-0.5"
              >
                <RouterLink to="/dashboard">
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton as-child tooltip="Devices" class="h-9 text-[15px] [&>svg]:size-[18px] [&>svg]:mr-0.5">
                <RouterLink to="/devices">
                  <Monitor />
                  <span>Devices</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel class="text-[11px] tracking-wider uppercase text-muted-foreground/70"
          >Settings</SidebarGroupLabel
        >
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton as-child tooltip="Profile" class="h-9 text-[15px] [&>svg]:size-[18px] [&>svg]:mr-0.5">
                <RouterLink to="/settings/profile">
                  <User />
                  <span>Profile</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter>
      <div class="px-3 py-2 text-[11px] text-muted-foreground group-data-[state=collapsed]:hidden">© 2026 AhogeK</div>
    </SidebarFooter>
  </Sidebar>
</template>
