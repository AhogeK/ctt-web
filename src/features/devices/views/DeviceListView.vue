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
import { ref, watch, onUnmounted } from 'vue'
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
import type { Device } from '@/lib/schemas/device.schema'

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
  return 'Unknown Device'
}
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <!-- Page Header -->
    <div class="flex flex-col gap-2">
      <h1 class="text-2xl font-semibold">Device Management</h1>
      <p class="text-sm text-muted-foreground">
        Manage your registered devices. Revoke access for devices you no longer use.
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
        <p class="font-medium text-destructive">Failed to load devices</p>
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
    <div v-else-if="!devices || devices.length === 0" class="flex flex-col items-center gap-4 rounded-lg border p-12">
      <Monitor class="h-12 w-12 text-muted-foreground" />
      <div class="text-center">
        <p class="font-medium">No devices registered</p>
        <p class="mt-1 text-sm text-muted-foreground">Devices will appear here when you log in from a new device.</p>
      </div>
      <Button variant="outline" size="sm" as-child>
        <a href="https://github.com/AhogeK/code-time-tracker" target="_blank" rel="noreferrer">
          Install the JetBrains plugin
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
            <Badge :variant="isDeviceActive(device) ? 'default' : 'outline'" class="text-xs">
              {{ isDeviceActive(device) ? 'Active' : 'Inactive' }}
            </Badge>
          </div>
          <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span v-if="device.platform">{{ device.platform }}</span>
            <span v-if="device.ideName">{{ device.ideName }} {{ device.ideVersion ?? '' }}</span>
            <span :title="formatDateTime(device.lastSeenAt)"
              >Last seen: {{ formatRelativeTime(device.lastSeenAt) }}</span
            >
          </div>
        </div>

        <!-- Actions -->
        <Button
          variant="outline"
          size="sm"
          class="text-destructive hover:bg-destructive/10 hover:text-destructive"
          :disabled="revokeMutation.isPending.value"
          :aria-label="'Revoke ' + getDeviceDisplayName(device)"
          @click="openRevokeDialog(device)"
        >
          <Trash2 class="h-4 w-4" />
          Revoke
        </Button>
      </div>
    </div>

    <!-- Revoke Confirmation Dialog -->
    <Dialog v-model:open="isDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revoke Device Access</DialogTitle>
          <DialogDescription>
            Are you sure you want to revoke access for
            <span class="font-medium text-foreground">{{
              deviceToRevoke ? getDeviceDisplayName(deviceToRevoke) : ''
            }}</span
            >? This action cannot be undone. The device will need to log in again to regain access.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="closeRevokeDialog"> Cancel </Button>
          <Button variant="destructive" :disabled="revokeMutation.isPending.value" @click="confirmRevoke">
            <Loader2 v-if="revokeMutation.isPending.value" class="h-4 w-4 animate-spin" />
            <Trash2 v-else class="h-4 w-4" />
            Revoke Device
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
