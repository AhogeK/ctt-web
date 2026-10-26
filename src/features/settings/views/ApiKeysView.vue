<script setup lang="ts">
/**
 * API Keys List View - Displays all API keys for the current user.
 *
 * Features:
 * - Lists keys with name, prefix, scopes, status, last used, created, expires
 * - Shows loading skeleton, empty state, and error state
 * - Status badges with semantic colors (ACTIVE=green, EXPIRED=gray, REVOKED=red)
 * - Scopes displayed as badge chips
 * - Relative time formatting for timestamps
 * - Create flow: CreateApiKeyDialog form -> RawKeyDialog one-time display
 *
 * Route: /settings/api-keys
 * API:  GET /api/v1/auth/api-keys, POST /api/v1/auth/api-keys
 */
import { computed, ref, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { KeyRound, Plus, AlertTriangle, Loader2 } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useApiKeys, useRevokeApiKey, useDeleteApiKey } from '@/composables/useApiKeys'
import type { ApiKey, ApiKeyScope, ApiKeyStatus, CreateApiKeyResponse } from '@/lib/schemas/api-key.schema'
import CreateApiKeyDialog from '@/features/settings/components/CreateApiKeyDialog.vue'
import RawKeyDialog from '@/features/settings/components/RawKeyDialog.vue'
import ConfirmApiKeyActionDialog from '@/features/settings/components/ConfirmApiKeyActionDialog.vue'
import { formatRelativeTime, formatDateTime } from '@/lib/utils'
import { extractErrorCode, getErrorMessage } from '@/lib/utils/api-error'

const { data: keys, isPending, isError, error, refetch } = useApiKeys()
const { mutation: revokeMutation } = useRevokeApiKey()
const { mutation: deleteMutation } = useDeleteApiKey()

const { t } = useI18n()

/** API codes keep their mapped sentence; a raw network error gets the page's own copy. */
const errorDetail = computed(() => {
  if (!error.value) return t('settings.apiKeys.loadFailedBody')
  return extractErrorCode(error.value) ? getErrorMessage(error.value) : t('settings.apiKeys.loadFailedBody')
})

const createDialogOpen = ref(false)
const rawKeyDialogOpen = ref(false)
/** Raw key awaiting display; kept only in memory for the dialog lifetime */
const pendingRawKey = ref('')
const revokeDialogOpen = ref(false)
/** API key currently selected for revocation; passed to the confirm dialog */
const selectedKeyForRevoke = ref<ApiKey | null>(null)
const deleteDialogOpen = ref(false)
/** API key currently selected for permanent deletion; passed to the confirm dialog */
const selectedKeyForDelete = ref<ApiKey | null>(null)

/** Minimum time the first-load skeleton must remain visible to avoid flicker (ms) */
const MIN_SKELETON_MS = 300

/**
 * Gate that keeps the first-load skeleton on screen for at least MIN_SKELETON_MS.
 *
 * Starts tracking only when there is no cached data (keys.value === undefined),
 * so background refetches never re-show the skeleton.
 * If the query resolves faster than MIN_SKELETON_MS, the skeleton stays until
 * the timer elapses.
 * Cleans up the timer on unmount to avoid leaking timeouts.
 */
const showSkeleton = ref(false)
let skeletonTimer: ReturnType<typeof setTimeout> | null = null

function clearSkeletonTimer(): void {
  if (skeletonTimer) {
    clearTimeout(skeletonTimer)
    skeletonTimer = null
  }
}

watch(
  isPending,
  (pending) => {
    if (pending && keys.value === undefined && skeletonTimer === null && !showSkeleton.value) {
      showSkeleton.value = true
      skeletonTimer = setTimeout(() => {
        skeletonTimer = null
        if (!isPending.value) {
          showSkeleton.value = false
        }
      }, MIN_SKELETON_MS)
    } else if (!pending && skeletonTimer === null && showSkeleton.value) {
      // Query finished after the minimum display window; hide immediately.
      showSkeleton.value = false
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  clearSkeletonTimer()
})

function openCreateDialog() {
  createDialogOpen.value = true
}

/**
 * Open the revoke confirmation dialog for the given API key.
 */
function openRevokeDialog(key: ApiKey) {
  selectedKeyForRevoke.value = key
  revokeDialogOpen.value = true
}

/**
 * Open the permanent-delete confirmation dialog for a REVOKED API key.
 * Only REVOKED rows expose the Delete button; ACTIVE/EXPIRED keys must be
 * revoked first (server enforces this too with 409 AUTH_023).
 */
function openDeleteDialog(key: ApiKey) {
  selectedKeyForDelete.value = key
  deleteDialogOpen.value = true
}

function handleCreated(response: CreateApiKeyResponse) {
  createDialogOpen.value = false
  pendingRawKey.value = response.rawKey
  rawKeyDialogOpen.value = true
}

/**
 * Clears the raw key from memory once the display dialog is dismissed.
 * The key is unrecoverable after this point; never keep it around.
 */
function handleRawKeyDialogClose(value: boolean) {
  rawKeyDialogOpen.value = value
  if (!value) {
    pendingRawKey.value = ''
  }
}

/**
 * Clears the selected key when the revoke dialog closes so the dialog
 * unmounts (via `v-if="selectedKeyForRevoke"`) and no stale key data
 * lingers. Mirrors the handleRawKeyDialogClose pattern.
 */
function handleRevokeDialogClose(value: boolean) {
  revokeDialogOpen.value = value
  if (!value) {
    selectedKeyForRevoke.value = null
  }
}

/**
 * Clears the selected key when the delete dialog closes so the dialog
 * unmounts (via `v-if="selectedKeyForDelete"`) and no stale key data
 * lingers. Mirrors the handleRevokeDialogClose pattern.
 */
function handleDeleteDialogClose(value: boolean) {
  deleteDialogOpen.value = value
  if (!value) {
    selectedKeyForDelete.value = null
  }
}

/** Enum values stay the API contract; the catalogue keys are display-only. */
const SCOPE_KEYS: Record<ApiKeyScope, string> = {
  READ: 'read',
  WRITE: 'write',
  SYNC: 'sync',
  ADMIN: 'admin',
}

const STATUS_KEYS: Record<ApiKeyStatus, string> = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  REVOKED: 'revoked',
}

function scopeLabel(scope: ApiKeyScope): string {
  return t(`settings.apiKeys.scopes.${SCOPE_KEYS[scope]}`)
}

function statusLabel(status: ApiKeyStatus): string {
  return t(`settings.apiKeys.status.${STATUS_KEYS[status]}`)
}

/**
 * Badge variant for a given key status.
 * - ACTIVE  → green (`default` variant with custom class)
 * - EXPIRED → gray (`outline` variant)
 * - REVOKED → red (`destructive` variant)
 */
function statusVariant(status: ApiKeyStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'ACTIVE':
      return 'default'
    case 'EXPIRED':
      return 'outline'
    case 'REVOKED':
      return 'destructive'
  }
}

/**
 * Extra CSS class for the status badge to override the default colour.
 */
function statusClass(status: ApiKeyStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'bg-success/15 text-success hover:bg-success/20 dark:bg-success/15 dark:text-success dark:hover:bg-success/20'
    case 'EXPIRED':
      return ''
    case 'REVOKED':
      return ''
  }
}
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold">{{ t('settings.apiKeys.title') }}</h1>
        <p class="text-sm text-muted-foreground">
          {{ t('settings.apiKeys.subtitle') }}
        </p>
      </div>
      <Button variant="default" size="sm" class="shrink-0 gap-1.5" @click="openCreateDialog">
        <Plus class="h-4 w-4" />
        {{ t('settings.apiKeys.create') }}
      </Button>
    </div>

    <!-- Loading State -->
    <div v-if="showSkeleton" class="flex flex-col gap-4">
      <div v-for="i in 4" :key="i" class="flex items-center gap-4 rounded-lg border p-4">
        <div class="flex flex-1 flex-col gap-2">
          <Skeleton class="h-4 w-44" />
          <Skeleton class="h-3 w-28" />
        </div>
        <Skeleton class="h-5 w-16 rounded-full" />
        <Skeleton class="h-3 w-20" />
        <Skeleton class="h-8 w-20" />
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="isError"
      class="flex flex-col items-center gap-4 rounded-lg border border-destructive/50 bg-destructive/10 p-8"
    >
      <AlertTriangle class="h-12 w-12 text-destructive" />
      <div class="text-center">
        <p class="font-medium text-destructive">{{ t('settings.apiKeys.loadFailedTitle') }}</p>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ errorDetail }}
        </p>
      </div>
      <Button variant="outline" size="sm" @click="() => refetch()">
        <Loader2 v-if="isPending" class="h-4 w-4 animate-spin" />
        {{ t('settings.common.retry') }}
      </Button>
    </div>

    <!-- Empty State -->
    <div v-else-if="!keys || keys.length === 0" class="flex flex-col items-center gap-4 rounded-lg border p-12">
      <KeyRound class="h-12 w-12 text-muted-foreground" />
      <div class="text-center">
        <p class="font-medium">{{ t('settings.apiKeys.emptyTitle') }}</p>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ t('settings.apiKeys.emptyBody') }}
        </p>
      </div>
      <Button variant="default" size="sm" class="gap-1.5" @click="openCreateDialog">
        <Plus class="h-4 w-4" />
        {{ t('settings.apiKeys.create') }}
      </Button>
    </div>

    <!-- API Key List -->
    <template v-else>
      <!-- API Key Table (desktop) -->
      <div class="hidden md:block overflow-hidden rounded-lg border" data-testid="api-key-table">
        <table class="w-full">
          <caption class="sr-only">
            {{
              t('settings.apiKeys.tableCaption')
            }}
          </caption>
          <thead>
            <tr
              class="border-b bg-muted/50 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              <th class="px-4 py-3">{{ t('settings.apiKeys.columns.name') }}</th>
              <th class="px-4 py-3">{{ t('settings.apiKeys.columns.keyPrefix') }}</th>
              <th class="px-4 py-3">{{ t('settings.apiKeys.columns.scopes') }}</th>
              <th class="px-4 py-3">{{ t('settings.apiKeys.columns.status') }}</th>
              <th class="px-4 py-3">{{ t('settings.apiKeys.columns.lastUsed') }}</th>
              <th class="px-4 py-3">{{ t('settings.apiKeys.columns.created') }}</th>
              <th class="px-4 py-3">{{ t('settings.apiKeys.columns.expires') }}</th>
              <th class="px-4 py-3">
                <span class="sr-only">{{ t('settings.apiKeys.actions') }}</span>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="key in keys" :key="key.id" class="transition-colors hover:bg-muted/30">
              <!-- Name -->
              <td class="px-4 py-3">
                <!-- break-all: names up to 100 chars have no spaces; without it a
                     long name widens the whole table column -->
                <span class="font-medium break-all">{{ key.name }}</span>
              </td>
              <!-- Key Prefix -->
              <td class="px-4 py-3">
                <code class="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
                  {{ key.keyPrefix }}
                </code>
              </td>
              <!-- Scopes -->
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1">
                  <Badge v-for="scope in key.scopes" :key="scope" variant="secondary" class="text-[10px] font-medium">
                    {{ scopeLabel(scope) }}
                  </Badge>
                </div>
              </td>
              <!-- Status -->
              <td class="px-4 py-3">
                <Badge :variant="statusVariant(key.status)" :class="statusClass(key.status)" class="text-[11px]">
                  {{ statusLabel(key.status) }}
                </Badge>
              </td>
              <!-- Last Used -->
              <td class="px-4 py-3 text-sm text-muted-foreground">
                <span :title="key.lastUsedAt ? formatDateTime(key.lastUsedAt) : undefined">
                  {{ formatRelativeTime(key.lastUsedAt) }}
                </span>
              </td>
              <!-- Created -->
              <td class="px-4 py-3 text-sm text-muted-foreground">
                <span :title="formatDateTime(key.createdAt)">
                  {{ formatRelativeTime(key.createdAt) }}
                </span>
              </td>
              <!-- Expires -->
              <td class="px-4 py-3 text-sm text-muted-foreground">
                <span v-if="key.expiresAt" :title="formatDateTime(key.expiresAt)">
                  {{ formatRelativeTime(key.expiresAt) }}
                </span>
                <span v-else class="italic">{{ t('settings.apiKeys.never') }}</span>
              </td>
              <!-- Actions -->
              <td class="px-4 py-3 text-right">
                <Button
                  v-if="key.status === 'ACTIVE'"
                  variant="outline"
                  size="sm"
                  class="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  :aria-label="t('settings.apiKeys.revokeAria', { name: key.name })"
                  @click="openRevokeDialog(key)"
                >
                  {{ t('settings.apiKeys.revoke') }}
                </Button>
                <Button
                  v-else-if="key.status === 'REVOKED' || key.status === 'EXPIRED'"
                  variant="outline"
                  size="sm"
                  class="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  :aria-label="t('settings.apiKeys.deleteAria', { name: key.name })"
                  @click="openDeleteDialog(key)"
                >
                  {{ t('settings.apiKeys.delete') }}
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- API Key Cards (mobile) -->
      <div class="md:hidden flex flex-col gap-3" data-testid="api-key-cards">
        <div
          v-for="key in keys"
          :key="key.id"
          data-testid="api-key-card"
          class="flex flex-col gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/30"
        >
          <!-- Header: name + status -->
          <div class="flex items-center justify-between gap-2">
            <!-- break-all + min-w-0: long space-less names wrap instead of
                 pushing the status badge out of the card -->
            <span class="font-medium min-w-0 break-all">{{ key.name }}</span>
            <Badge :variant="statusVariant(key.status)" :class="statusClass(key.status)" class="text-[11px]">
              {{ statusLabel(key.status) }}
            </Badge>
          </div>

          <!-- Key prefix -->
          <code class="w-fit rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
            {{ key.keyPrefix }}
          </code>

          <!-- Scopes -->
          <div class="flex flex-wrap gap-1">
            <Badge v-for="scope in key.scopes" :key="scope" variant="secondary" class="text-[10px] font-medium">
              {{ scopeLabel(scope) }}
            </Badge>
          </div>

          <!-- Metadata -->
          <div class="flex flex-col gap-1 text-sm text-muted-foreground">
            <div class="flex items-center justify-between">
              <span>{{ t('settings.apiKeys.lastUsed') }}</span>
              <span :title="key.lastUsedAt ? formatDateTime(key.lastUsedAt) : undefined">
                {{ formatRelativeTime(key.lastUsedAt) }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span>{{ t('settings.apiKeys.created') }}</span>
              <span :title="formatDateTime(key.createdAt)">
                {{ formatRelativeTime(key.createdAt) }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span>{{ t('settings.apiKeys.expires') }}</span>
              <span v-if="key.expiresAt" :title="formatDateTime(key.expiresAt)">
                {{ formatRelativeTime(key.expiresAt) }}
              </span>
              <span v-else class="italic">{{ t('settings.apiKeys.never') }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div v-if="key.status === 'ACTIVE'" class="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              class="text-destructive hover:bg-destructive/10 hover:text-destructive"
              :aria-label="t('settings.apiKeys.revokeAria', { name: key.name })"
              @click="openRevokeDialog(key)"
            >
              {{ t('settings.apiKeys.revoke') }}
            </Button>
          </div>
          <div v-else-if="key.status === 'REVOKED' || key.status === 'EXPIRED'" class="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              class="text-destructive hover:bg-destructive/10 hover:text-destructive"
              :aria-label="t('settings.apiKeys.deleteAria', { name: key.name })"
              @click="openDeleteDialog(key)"
            >
              {{ t('settings.apiKeys.delete') }}
            </Button>
          </div>
        </div>
      </div>
    </template>

    <!-- Create flow dialogs -->
    <CreateApiKeyDialog v-model:open="createDialogOpen" @success="handleCreated" />
    <RawKeyDialog v-model:open="rawKeyDialogOpen" :raw-key="pendingRawKey" @update:open="handleRawKeyDialogClose" />
    <ConfirmApiKeyActionDialog
      v-if="selectedKeyForRevoke"
      :open="revokeDialogOpen"
      :api-key="selectedKeyForRevoke"
      :mutation="revokeMutation"
      :title="t('settings.apiKeys.revokeTitle')"
      :description="t('settings.apiKeys.revokeDescription')"
      :confirm-label="t('settings.apiKeys.revokeConfirm')"
      :pending-label="t('settings.apiKeys.revokePending')"
      :success-title="t('settings.apiKeys.revokeSuccess')"
      :success-description="(name: string) => t('settings.apiKeys.revokeSuccessBody', { name })"
      :error-title="t('settings.apiKeys.revokeError')"
      @update:open="handleRevokeDialogClose"
    />
    <ConfirmApiKeyActionDialog
      v-if="selectedKeyForDelete"
      :open="deleteDialogOpen"
      :api-key="selectedKeyForDelete"
      :mutation="deleteMutation"
      :title="t('settings.apiKeys.deleteTitle')"
      :description="t('settings.apiKeys.deleteDescription')"
      :confirm-label="t('settings.apiKeys.deleteConfirm')"
      :pending-label="t('settings.apiKeys.deletePending')"
      :success-title="t('settings.apiKeys.deleteSuccess')"
      :success-description="(name: string) => t('settings.apiKeys.deleteSuccessBody', { name })"
      :error-title="t('settings.apiKeys.deleteError')"
      @update:open="handleDeleteDialogClose"
    />
  </div>
</template>
