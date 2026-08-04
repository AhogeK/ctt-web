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
import { ref } from 'vue'
import { KeyRound, Plus, AlertTriangle, Loader2 } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useApiKeys } from '@/composables/useApiKeys'
import type { ApiKey, ApiKeyScope, ApiKeyStatus, CreateApiKeyResponse } from '@/lib/schemas/api-key.schema'
import CreateApiKeyDialog from '@/features/settings/components/CreateApiKeyDialog.vue'
import RawKeyDialog from '@/features/settings/components/RawKeyDialog.vue'
import RevokeApiKeyDialog from '@/features/settings/components/RevokeApiKeyDialog.vue'

const { data: keys, isPending, isError, error, refetch } = useApiKeys()

const createDialogOpen = ref(false)
const rawKeyDialogOpen = ref(false)
/** Raw key awaiting display; kept only in memory for the dialog lifetime */
const pendingRawKey = ref('')
const revokeDialogOpen = ref(false)
/** API key currently selected for revocation; passed to RevokeApiKeyDialog */
const selectedKeyForRevoke = ref<ApiKey | null>(null)

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
 * Render a timestamp as a relative time string.
 * Handles both past (lastUsedAt) and future (expiresAt) dates.
 * Matches the formatLastSeen pattern in DeviceListView for past dates.
 */
function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Never'

  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffMins = Math.floor(Math.abs(diffMs) / 60000)
  const diffHours = Math.floor(Math.abs(diffMs) / 3600000)
  const diffDays = Math.floor(Math.abs(diffMs) / 86400000)

  if (diffMs < 0) {
    // Past date — relative past
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 30) return `${diffDays}d ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
    return date.toLocaleDateString()
  }

  // Future date — relative future
  if (diffDays === 0) return 'Today'
  if (diffDays < 30) return `in ${diffDays}d`
  if (diffDays < 365) return `in ${Math.floor(diffDays / 30)}mo`
  return date.toLocaleDateString()
}

/**
 * Render a date string as a short localised date.
 * Used for the "Created" and "Expires" columns.
 */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString()
}

/**
 * Maps a scope enum value to a display label.
 * Currently a pass-through; will return localised labels once i18n is in place.
 */
function scopeLabel(scope: ApiKeyScope): string {
  return scope
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
      return 'bg-emerald-600/15 text-emerald-600 hover:bg-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-400 dark:hover:bg-emerald-500/20'
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
        <h1 class="text-2xl font-semibold">API Keys</h1>
        <p class="text-sm text-muted-foreground">
          Manage API keys used for JetBrains plugin authentication. Keys are shown only once at creation.
        </p>
      </div>
      <Button variant="default" size="sm" class="shrink-0 gap-1.5" @click="openCreateDialog">
        <Plus class="h-4 w-4" />
        Create API Key
      </Button>
    </div>

    <!-- Loading State -->
    <div v-if="isPending" class="flex flex-col gap-4">
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
        <p class="font-medium text-destructive">Failed to load API keys</p>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ error?.message ?? 'An unexpected error occurred' }}
        </p>
      </div>
      <Button variant="outline" size="sm" @click="() => refetch()">
        <Loader2 v-if="isPending" class="h-4 w-4 animate-spin" />
        Retry
      </Button>
    </div>

    <!-- Empty State -->
    <div v-else-if="!keys || keys.length === 0" class="flex flex-col items-center gap-4 rounded-lg border p-12">
      <KeyRound class="h-12 w-12 text-muted-foreground" />
      <div class="text-center">
        <p class="font-medium">No API keys yet</p>
        <p class="mt-1 text-sm text-muted-foreground">
          Create an API key to use with the JetBrains plugin for secure authentication.
        </p>
      </div>
      <Button variant="default" size="sm" class="gap-1.5" @click="openCreateDialog">
        <Plus class="h-4 w-4" />
        Create API Key
      </Button>
    </div>

    <!-- API Key Table (GitHub PAT style) -->
    <div v-else class="overflow-hidden rounded-lg border">
      <table class="w-full">
        <thead>
          <tr class="border-b bg-muted/50 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <th class="px-4 py-3">Name</th>
            <th class="px-4 py-3">Key Prefix</th>
            <th class="px-4 py-3">Scopes</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">Last Used</th>
            <th class="px-4 py-3">Created</th>
            <th class="px-4 py-3">Expires</th>
            <th class="px-4 py-3"><span class="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody class="divide-y">
          <tr v-for="key in keys" :key="key.id" class="transition-colors hover:bg-muted/30">
            <!-- Name -->
            <td class="px-4 py-3">
              <span class="font-medium">{{ key.name }}</span>
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
                {{ key.status }}
              </Badge>
            </td>
            <!-- Last Used -->
            <td class="px-4 py-3 text-sm text-muted-foreground">
              <span :title="key.lastUsedAt ?? undefined">
                {{ formatRelativeTime(key.lastUsedAt) }}
              </span>
            </td>
            <!-- Created -->
            <td class="px-4 py-3 text-sm text-muted-foreground">
              <span :title="key.createdAt">
                {{ formatDate(key.createdAt) }}
              </span>
            </td>
            <!-- Expires -->
            <td class="px-4 py-3 text-sm text-muted-foreground">
              <span v-if="key.expiresAt" :title="key.expiresAt">
                {{ formatRelativeTime(key.expiresAt) }}
              </span>
              <span v-else class="italic">Never</span>
            </td>
            <!-- Actions (placeholder for M3) -->
            <td class="px-4 py-3 text-right">
              <Button
                v-if="key.status === 'ACTIVE'"
                variant="outline"
                size="sm"
                class="text-destructive hover:bg-destructive/10 hover:text-destructive"
                @click="openRevokeDialog(key)"
              >
                Revoke
              </Button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create flow dialogs -->
    <CreateApiKeyDialog v-model:open="createDialogOpen" @success="handleCreated" />
    <RawKeyDialog v-model:open="rawKeyDialogOpen" :raw-key="pendingRawKey" @update:open="handleRawKeyDialogClose" />
    <RevokeApiKeyDialog
      v-if="selectedKeyForRevoke"
      :open="revokeDialogOpen"
      :api-key="selectedKeyForRevoke"
      @update:open="handleRevokeDialogClose"
    />
  </div>
</template>
