<script setup lang="ts">
/**
 * Data export card for the security page.
 *
 * The export is a single JSON document that the server streams as an attachment. It is written
 * to disk byte for byte and never parsed: round-tripping it through a schema would reorder keys
 * and drop whatever this client does not model, while the plugin imports the file back field
 * for field.
 */
import { computed } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { SETTINGS_ACTION_BUTTON_CLASS } from './action-button'
import { cn } from '@/lib/utils'
import { isApiError } from '@/lib/utils/api-error'
import { downloadUserExport } from '@/lib/api'

const { t } = useI18n()

/**
 * Hands a blob to the browser's download manager.
 *
 * The object URL is revoked on the next task rather than synchronously: a revoke issued before
 * the browser has read the blob can cancel the download in some engines.
 *
 * @param blob - the document to save
 * @param filename - the name to save it under, as the server named it
 */
function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

const mutation = useMutation({
  mutationFn: () => downloadUserExport(),
  onSuccess: ({ blob, filename }) => {
    saveBlob(blob, filename)
    toast.success(t('settings.security.export.started'), {
      description: t('settings.security.export.startedBody', { filename }),
    })
  },
  onError: (error) => {
    // This request downloads a blob, so its error body is a blob as well and the backend's code
    // cannot be read out of it — the status is what is left to branch on.
    const status = isApiError(error) ? error.statusCode : undefined

    // 401 is the interceptor's: it clears the session and redirects, so a toast here would race it.
    if (status === 401) return

    // The export has its own hourly allowance, so it says so instead of the generic rate-limit
    // wording every other request shares.
    const description = status === 429 ? t('settings.security.export.rateLimited') : undefined
    toast.error(t('settings.security.export.failed'), { description })
  },
})

const isPreparing = computed(() => mutation.isPending.value)
</script>

<template>
  <div data-surface="card" class="rounded-lg border border-border dark:border-white/8 bg-muted dark:bg-card p-6">
    <h2 class="text-lg font-medium text-foreground dark:text-foreground">{{ t('settings.security.export.title') }}</h2>
    <p class="mt-1 max-w-prose text-sm text-muted-foreground dark:text-muted-foreground">
      {{ t('settings.security.export.description') }}
    </p>

    <Button
      variant="outline"
      :class="cn(SETTINGS_ACTION_BUTTON_CLASS, 'mt-4')"
      :disabled="isPreparing"
      data-testid="export-download"
      @click="mutation.mutate()"
    >
      {{ isPreparing ? t('settings.security.export.preparing') : t('settings.security.export.button') }}
    </Button>
  </div>
</template>
