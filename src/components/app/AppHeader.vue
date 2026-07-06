<script setup lang="ts">
import { ref, computed } from 'vue'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { LogOut, Loader2, Sun, Moon, Monitor } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore, type ThemeMode } from '@/stores/theme'
import UserAvatar from './UserAvatar.vue'

/**
 * AppHeader - Sticky header with user avatar menu
 *
 * Desktop: collapse toggle lives in the sidebar header (see AppSidebar);
 *          only the user avatar dropdown is exposed here.
 * Mobile:  sidebar renders inside a Sheet/Dialog overlay whose internal
 *          SidebarHeader is unreachable while closed, so we expose the
 *          SidebarTrigger here as the only way to open the sidebar.
 *
 * Theme control follows the Perplexity-style pattern: instead of an
 * always-visible toggle button, the user picks "Appearance" → Light/Dark/
 * System from inside the avatar dropdown. Each option shows a Lucide icon
 * (Sun/Moon/Monitor) for quick visual recognition; the submenu trigger
 * mirrors that pattern by showing the icon AND a subtitle line of the
 * currently active theme (e.g. "Light", "Dark", or "System (Light)"
 * when auto resolves to the light variant) — so the user always knows
 * the current state without opening the submenu.
 */
const authStore = useAuthStore()
const themeStore = useThemeStore()
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

/** Icon component for the current theme mode (used in Appearance submenu trigger) */
const ThemeIcon = computed(() => {
  switch (themeStore.mode) {
    case 'dark':
      return Moon
    case 'light':
      return Sun
    default:
      return Monitor
  }
})

/**
 * Subtitle line shown below "Appearance" on the submenu trigger.
 *
 * Follows the Perplexity pattern: the user sees the currently active
 * theme without having to open the submenu. For explicit modes the
 * label is just "Light"/"Dark"; for the "auto" (System) mode the
 * resolved preference is appended in parentheses so the user knows what
 * the page actually looks like right now.
 *
 * Examples (English only — matches the rest of the UI):
 * - mode=light           → "Light"
 * - mode=dark            → "Dark"
 * - mode=auto + light OS → "System (Light)"
 * - mode=auto + dark OS  → "System (Dark)"
 *
 * Color is state-adaptive (template uses Tailwind `group-` variants on
 * the SubTrigger's `class="group"`):
 * - Normal state → `text-muted-foreground` (dark gray, readable on white)
 * - Focused/hovered/open state → `text-accent-foreground/80` (light
 *   white at 80% opacity, readable on the purple accent background)
 *
 * The previous Round 4 attempt used `!text-muted-foreground` to defeat
 * the parent's `data-[state=open]:text-accent-foreground` override,
 * but muted-foreground is still too dark on the strong purple accent bg
 * to be legible. The `group-focus:` + `group-data-[state=open]:` pair
 * switches to a light accent-foreground-derived color whenever the
 * trigger row is highlighted (keyboard focus OR submenu open).
 */
const currentThemeLabel = computed(() => {
  const mode = themeStore.mode
  if (mode === 'auto') {
    return themeStore.isDark ? 'System (Dark)' : 'System (Light)'
  }
  return mode === 'dark' ? 'Dark' : 'Light'
})

/**
 * Two-way binding for the Appearance radio group.
 *
 * `themeStore.mode` is the source of truth; the radio group writes back
 * to it via `setTheme` so the store's side effects (DOM class sync, local-
 * Storage persistence) fire exactly as they do from ThemeToggle. We do NOT
 * use `v-model` because DropdownMenuRadioGroup's `modelValue` updates on
 * `@update:modelValue`, and `setTheme` must be the single mutator to keep
 * the "auto → system preference" branch consistent.
 */
function handleThemeChange(value: unknown): void {
  if (typeof value !== 'string') return
  if (value === 'light' || value === 'dark' || value === 'auto') {
    themeStore.setTheme(value as ThemeMode)
  }
}

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
                  class="rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger class="group">
                    <component :is="ThemeIcon" class="mr-2 h-4 w-4" />
                    <div class="flex flex-col gap-1">
                      <span>Appearance</span>
                      <span
                        data-testid="appearance-current"
                        class="text-xs text-muted-foreground group-focus:!text-accent-foreground/80 group-data-[state=open]:!text-accent-foreground/80"
                        >{{ currentThemeLabel }}</span
                      >
                    </div>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup :model-value="themeStore.mode" @update:model-value="handleThemeChange">
                      <DropdownMenuRadioItem value="light">
                        <Sun class="mr-2 h-4 w-4" />
                        <span>Light</span>
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="dark">
                        <Moon class="mr-2 h-4 w-4" />
                        <span>Dark</span>
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="auto">
                        <Monitor class="mr-2 h-4 w-4" />
                        <span>System</span>
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
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
