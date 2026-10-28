<script setup lang="ts">
/**
 * Security settings view.
 *
 * Two facts about the account that a profile page has no room for: where it is signed in, and
 * how to take its data elsewhere. Both are account-scoped resources rather than preferences, so
 * they live together here instead of among the appearance controls.
 */
import { useI18n } from 'vue-i18n'
import DataExportCard from '../components/DataExportCard.vue'
import LoginSessionsCard from '../components/LoginSessionsCard.vue'

const { t } = useI18n()
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <div class="flex flex-col gap-2">
      <h1 class="text-2xl font-semibold text-foreground dark:text-foreground">{{ t('settings.security.title') }}</h1>
      <p class="text-sm text-muted-foreground dark:text-muted-foreground">
        {{ t('settings.security.subtitle') }}
      </p>
    </div>

    <LoginSessionsCard />
    <DataExportCard />
  </div>
</template>
