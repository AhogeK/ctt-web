<script setup lang="ts">
/**
 * Settings section shell.
 *
 * Owns the settings sub-navigation (one entry per section, in IA order) and
 * renders the active section through the nested <router-view>. Desktop shows a
 * vertical rail beside the content; below md it collapses into a horizontally
 * scrollable tab row above it.
 *
 * Accessibility: a named <nav>, router links that carry aria-current="page"
 * only on the active section, and a visible focus ring — the same contract the
 * app sidebar follows.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { RouteNames, type RouteName } from '@/router/route-names'

interface SettingsSection {
  name: RouteName
  /** Message key for the section label. */
  labelKey: string
  /** Message key for the one-line description shown beside the label on desktop. */
  descriptionKey: string
}

/** Sections in IA order — the single source the rail and the mobile tabs share. */
const SECTIONS: SettingsSection[] = [
  {
    name: RouteNames.SETTINGS_PROFILE,
    labelKey: 'settings.sections.profile',
    descriptionKey: 'settings.sections.profileDescription',
  },
  {
    name: RouteNames.SETTINGS_DEVICES,
    labelKey: 'settings.sections.devices',
    descriptionKey: 'settings.sections.devicesDescription',
  },
  {
    name: RouteNames.SETTINGS_PREFERENCES,
    labelKey: 'settings.sections.preferences',
    descriptionKey: 'settings.sections.preferencesDescription',
  },
  {
    name: RouteNames.SETTINGS_API_KEYS,
    labelKey: 'settings.sections.apiKeys',
    descriptionKey: 'settings.sections.apiKeysDescription',
  },
]

const route = useRoute()
const { t } = useI18n()

/**
 * Read through a computed so the rail only re-renders when the section
 * changes — a query-only update on the same page must not repaint it (same
 * reasoning as the app sidebar's activePath).
 */
const activeName = computed(() => route.name)
</script>

<template>
  <div class="md:grid md:grid-cols-[220px_minmax(0,1fr)] md:items-start md:gap-6">
    <nav
      :aria-label="t('settings.sections.navLabel')"
      class="border-b px-4 py-3 md:border-b-0 md:border-r md:px-0 md:py-6 md:pr-4"
    >
      <ul class="flex gap-1 overflow-x-auto md:flex-col md:gap-0.5">
        <li v-for="section in SECTIONS" :key="section.name" class="shrink-0 md:shrink">
          <RouterLink
            :to="{ name: section.name }"
            :aria-current="activeName === section.name ? 'page' : undefined"
            class="block rounded-md px-3 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            :class="
              activeName === section.name
                ? 'bg-primary font-medium text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
            "
          >
            <span class="block">{{ t(section.labelKey) }}</span>
            <span class="hidden text-xs font-normal md:block">{{ t(section.descriptionKey) }}</span>
          </RouterLink>
        </li>
      </ul>
    </nav>

    <div class="min-w-0">
      <RouterView />
    </div>
  </div>
</template>
