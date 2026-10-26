<script setup lang="ts">
/**
 * Device List View - Displays all registered devices for the current user.
 *
 * Features:
 * - Lists devices with name, platform, last active time
 * - Shows device status (active/revoked based on lastSeenAt)
 * - Allows revoking individual devices with confirmation dialog
 * - Uses TanStack Query for data fetching and caching
 */
import { computed, ref, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Monitor, Smartphone, Laptop, Globe, Trash2, Loader2, AlertTriangle } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useDevices, useRevokeDevice } from '@/composables/useDevices'
import { formatRelativeTime, formatDateTime } from '@/lib/utils'
import { extractErrorCode, getErrorMessage } from '@/lib/utils/api-error'
import type { Device } from '@/lib/schemas/device.schema'

const { t } = useI18n()
const { data: devices, isPending, isError, error, refetch } = useDevices()
const { mutation: revokeMutation } = useRevokeDevice()

const deviceToRevoke = ref<Device | null>(null)
const isDialogOpen = ref(false)

/** Minimum time the first-load skeleton must remain visible to avoid flicker (ms) */
const MIN_SKELETON_MS = 300

/**
 * Gate that keeps the first-load skeleton on screen for at least MIN_SKELETON_MS.
 *
 * Starts tracking only when there is no cached data (devices.value === undefined),
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
    if (pending && devices.value === undefined && skeletonTimer === null && !showSkeleton.value) {
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

function openRevokeDialog(device: Device) {
  deviceToRevoke.value = device
  isDialogOpen.value = true
}

function closeRevokeDialog() {
  deviceToRevoke.value = null
  isDialogOpen.value = false
}

function confirmRevoke() {
  if (!deviceToRevoke.value) return

  revokeMutation.mutate(
    { deviceId: deviceToRevoke.value.id },
    {
      onSuccess: () => {
        closeRevokeDialog()
      },
    },
  )
}

function isDeviceActive(device: Device): boolean {
  const lastSeen = new Date(device.lastSeenAt)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  return lastSeen > sevenDaysAgo
}

/**
 * Whether the device was revoked (backend `revokedAt` non-null, v0.50.0).
 * Revoked devices render a destructive label and lose the Revoke action.
 */
function isDeviceRevoked(device: Device): boolean {
  return device.revokedAt !== null && device.revokedAt !== undefined
}

/** Server codes keep their mapped sentence; a raw network error gets the page's own copy. */
const errorDetail = computed(() => {
  if (!error.value) return t('settings.devices.loadFailedBody')
  return extractErrorCode(error.value) ? getErrorMessage(error.value) : t('settings.devices.loadFailedBody')
})

function deviceStatus(device: Device): string {
  if (isDeviceRevoked(device)) return t('settings.devices.revoked')
  return isDeviceActive(device) ? t('settings.devices.active') : t('settings.devices.inactive')
}

function getPlatformIcon(platform: string | null) {
  const p = platform?.toLowerCase() ?? ''
  if (p.includes('windows')) return Monitor
  if (p.includes('mac') || p.includes('darwin')) return Laptop
  if (p.includes('linux')) return Monitor
  if (p.includes('android')) return Smartphone
  if (p.includes('ios')) return Smartphone
  if (p.includes('web')) return Globe
  return Monitor
}

function getDeviceDisplayName(device: Device): string {
  if (device.deviceName) return device.deviceName
  if (device.ideName) return `${device.ideName} ${device.ideVersion ?? ''}`.trim()
  return t('settings.devices.unknownDevice')
}

function getDeviceIdeLabel(device: Device): string {
  const name = device.ideName ?? ''
  const version = device.ideVersion ?? ''
  return `${name} ${version}`.trim()
}
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <!-- Page Header -->
    <div class="flex flex-col gap-2">
      <h1 class="text-2xl font-semibold">{{ t('settings.devices.title') }}</h1>
      <p class="text-sm text-muted-foreground">
        {{ t('settings.devices.subtitle') }}
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="showSkeleton" class="flex flex-col gap-4">
      <div v-for="i in 3" :key="i" class="flex items-center gap-4 rounded-lg border p-4">
        <Skeleton class="h-10 w-10 rounded-full" />
        <div class="flex flex-1 flex-col gap-2">
          <Skeleton class="h-4 w-40" />
          <Skeleton class="h-3 w-24" />
        </div>
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
        <p class="font-medium text-destructive">{{ t('settings.devices.loadFailedTitle') }}</p>
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
    <div v-else-if="!devices || devices.length === 0" class="flex flex-col items-center gap-4 rounded-lg border p-12">
      <Monitor class="h-12 w-12 text-muted-foreground" />
      <div class="text-center">
        <p class="font-medium">{{ t('settings.devices.emptyTitle') }}</p>
        <p class="mt-1 text-sm text-muted-foreground">{{ t('settings.devices.emptyBody') }}</p>
      </div>
      <Button variant="outline" size="sm" as-child>
        <a href="https://github.com/AhogeK/code-time-tracker" target="_blank" rel="noreferrer">
          {{ t('settings.devices.installPlugin') }}
        </a>
      </Button>
    </div>

    <!-- Device List -->
    <div v-else class="flex flex-col gap-3" data-testid="device-list">
      <div
        v-for="device in devices"
        :key="device.id"
        class="flex flex-col gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center"
        data-testid="device-card"
      >
        <!-- Device Icon -->
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
          <component :is="getPlatformIcon(device.platform)" class="h-5 w-5 text-muted-foreground" />
        </div>

        <!-- Device Info -->
        <div class="flex flex-1 flex-col gap-1">
          <div class="flex items-center gap-2">
            <span class="font-medium">{{ getDeviceDisplayName(device) }}</span>
            <Badge
              :variant="isDeviceRevoked(device) ? 'destructive' : isDeviceActive(device) ? 'default' : 'outline'"
              class="text-xs"
            >
              {{ deviceStatus(device) }}
            </Badge>
          </div>
          <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span v-if="device.platform">{{ device.platform }}</span>
            <span v-if="device.ideName">
              {{ t('settings.devices.lastUsedIde', { ide: getDeviceIdeLabel(device) }) }}
            </span>
            <span :title="formatDateTime(device.lastSeenAt)">
              {{ t('settings.devices.lastSeen', { time: formatRelativeTime(device.lastSeenAt) }) }}
            </span>
          </div>
        </div>

        <!-- Actions -->
        <Button
          v-if="!isDeviceRevoked(device)"
          variant="outline"
          size="sm"
          class="text-destructive hover:bg-destructive/10 hover:text-destructive"
          :disabled="revokeMutation.isPending.value"
          :aria-label="t('settings.devices.revokeAria', { name: getDeviceDisplayName(device) })"
          @click="openRevokeDialog(device)"
        >
          <Trash2 class="h-4 w-4" />
          {{ t('settings.devices.revoke') }}
        </Button>
      </div>
    </div>

    <!-- Revoke Confirmation Dialog -->
    <Dialog v-model:open="isDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t('settings.devices.revokeTitle') }}</DialogTitle>
          <DialogDescription>
            {{
              t('settings.devices.revokeDescription', {
                name: deviceToRevoke ? getDeviceDisplayName(deviceToRevoke) : '',
              })
            }}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="closeRevokeDialog"> {{ t('settings.common.cancel') }} </Button>
          <Button variant="destructive" :disabled="revokeMutation.isPending.value" @click="confirmRevoke">
            <Loader2 v-if="revokeMutation.isPending.value" class="h-4 w-4 animate-spin" />
            <Trash2 v-else class="h-4 w-4" />
            {{ t('settings.devices.revokeConfirm') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
