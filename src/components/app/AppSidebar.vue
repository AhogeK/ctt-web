<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
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
import { RouterLink, useRoute } from 'vue-router'
import {
  LayoutDashboard,
  Trophy,
  ListOrdered,
  User,
  ShieldCheck,
  Monitor,
  SlidersHorizontal,
  KeyRound,
} from '@lucide/vue'
import PluginIcon from './PluginIcon.vue'

/**
 * AppSidebar - Navigation sidebar for application pages
 *
 * Header behavior:
 * - Desktop, expanded:  Plugin icon left, collapse trigger right
 * - Desktop, collapsed: Plugin icon centered, swaps to themed expand trigger on hover
 * - Mobile:             No header chrome — AppHeader owns the open trigger and the
 *                       Sheet closes via overlay click or navigation (see handleNavigate).
 *
 * Active state: the current route highlights its menu item via the shared
 * sidebar data-active styles (brand violet background).
 *
 * Settings sections are leaves here, not a separate page-level rail: one
 * navigation surface lists every destination, and each settings page shows only
 * its own content beside it.
 */
const route = useRoute()
const { state, isMobile, setOpenMobile } = useSidebar()
const { t } = useI18n()

/**
 * The current path, read through a computed so the sidebar only re-renders when
 * the PATH changes.
 *
 * vue-router replaces its `currentRoute` ref wholesale, so reading `route.path`
 * directly in the template made every query-only change (a panel picking its
 * own window) re-render the sidebar and the rest of the app shell. A computed
 * compares by value, so an unchanged path no longer propagates.
 */
const activePath = computed(() => route.path)

/**
 * Whether the given menu path matches the current route exactly.
 * Every sidebar target is a leaf page, so a prefix rule would wrongly highlight
 * Profile while API Keys is active (/settings/*).
 */
function isPathActive(path: string): boolean {
  return activePath.value === path
}

/**
 * Close the mobile Sheet after a navigation click.
 * Desktop is a no-op (isMobile false); on mobile the Sheet would otherwise stay
 * open covering the destination page.
 */
function handleNavigate() {
  if (isMobile.value) {
    setOpenMobile(false)
  }
}
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
            Mobile (neither branch matches): no header chrome at all — AppHeader owns
            the open trigger, overlay click or navigation closes the Sheet.
          -->
          <div v-else-if="!isMobile" class="group/trigger mx-auto grid h-9 w-9 place-items-center">
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
        <SidebarGroupLabel class="text-[11px] tracking-wider uppercase">{{
          t('nav.groupNavigation')
        }}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                as-child
                :tooltip="t('nav.dashboard')"
                class="h-9 text-[15px] [&>svg]:size-[18px] [&>svg]:mr-0.5"
                @click="handleNavigate"
                :is-active="isPathActive('/dashboard')"
              >
                <RouterLink to="/dashboard">
                  <LayoutDashboard />
                  <span>{{ t('nav.dashboard') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                as-child
                :tooltip="t('nav.achievements')"
                class="h-9 text-[15px] [&>svg]:size-[18px] [&>svg]:mr-0.5"
                @click="handleNavigate"
                :is-active="isPathActive('/achievements')"
              >
                <RouterLink to="/achievements">
                  <Trophy />
                  <span>{{ t('nav.achievements') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                as-child
                :tooltip="t('nav.leaderboard')"
                class="h-9 text-[15px] [&>svg]:size-[18px] [&>svg]:mr-0.5"
                @click="handleNavigate"
                :is-active="isPathActive('/leaderboard')"
              >
                <RouterLink to="/leaderboard">
                  <ListOrdered />
                  <span>{{ t('nav.leaderboard') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel class="text-[11px] tracking-wider uppercase">{{ t('nav.groupSettings') }}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                as-child
                :tooltip="t('nav.profile')"
                class="h-9 text-[15px] [&>svg]:size-[18px] [&>svg]:mr-0.5"
                @click="handleNavigate"
                :is-active="isPathActive('/settings/profile')"
              >
                <RouterLink to="/settings/profile">
                  <User />
                  <span>{{ t('nav.profile') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                as-child
                :tooltip="t('nav.security')"
                class="h-9 text-[15px] [&>svg]:size-[18px] [&>svg]:mr-0.5"
                @click="handleNavigate"
                :is-active="isPathActive('/settings/security')"
              >
                <RouterLink to="/settings/security">
                  <ShieldCheck />
                  <span>{{ t('nav.security') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                as-child
                :tooltip="t('nav.devices')"
                class="h-9 text-[15px] [&>svg]:size-[18px] [&>svg]:mr-0.5"
                @click="handleNavigate"
                :is-active="isPathActive('/settings/devices')"
              >
                <RouterLink to="/settings/devices">
                  <Monitor />
                  <span>{{ t('nav.devices') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                as-child
                :tooltip="t('nav.preferences')"
                class="h-9 text-[15px] [&>svg]:size-[18px] [&>svg]:mr-0.5"
                @click="handleNavigate"
                :is-active="isPathActive('/settings/preferences')"
              >
                <RouterLink to="/settings/preferences">
                  <SlidersHorizontal />
                  <span>{{ t('nav.preferences') }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                as-child
                :tooltip="t('nav.apiKeys')"
                class="h-9 text-[15px] [&>svg]:size-[18px] [&>svg]:mr-0.5"
                @click="handleNavigate"
                :is-active="isPathActive('/settings/api-keys')"
              >
                <RouterLink to="/settings/api-keys">
                  <KeyRound />
                  <span>{{ t('nav.apiKeys') }}</span>
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
