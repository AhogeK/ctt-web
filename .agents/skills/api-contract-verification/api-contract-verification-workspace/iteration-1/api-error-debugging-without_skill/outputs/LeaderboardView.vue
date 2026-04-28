<script setup lang="ts">
/**
 * Leaderboard View - Displays global coding time rankings.
 *
 * Features:
 * - Shows top 20 users by total coding time
 * - Displays current user's position and rank
 * - Proper error handling with specific messages:
 *   - LEADERBOARD_001: "The leaderboard is currently unavailable..."
 *   - LEADERBOARD_002: "You are not ranked on the leaderboard yet..."
 * - Loading skeletons and retry functionality
 * - Uses TanStack Query for data fetching and caching
 */
import { Trophy, User, Loader2, AlertCircle, RefreshCw } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useGlobalLeaderboard,
  useUserLeaderboardPosition,
  getLeaderboardErrorMessage,
} from '../composables/useLeaderboard'
import type { LeaderboardEntry } from '@/lib/schemas/leaderboard.schema'

const {
  data: leaderboard,
  isPending: isLeaderboardPending,
  isError: isLeaderboardError,
  error: leaderboardError,
  refetch: refetchLeaderboard,
} = useGlobalLeaderboard()
const {
  data: userPosition,
  isPending: isUserPending,
  isError: isUserError,
  error: userError,
  refetch: refetchUser,
} = useUserLeaderboardPosition()

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

function getRankBadgeVariant(rank: number): 'default' | 'secondary' | 'outline' {
  if (rank === 1) return 'default'
  if (rank === 2) return 'secondary'
  if (rank === 3) return 'outline'
  return 'outline'
}

function getRankIcon(rank: number): string {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}

function retryAll() {
  void refetchLeaderboard()
  void refetchUser()
}

function getCombinedErrorMessage(): string {
  const error = leaderboardError.value || userError.value
  return getLeaderboardErrorMessage(error)
}
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <!-- Page Header -->
    <div class="flex flex-col gap-2">
      <h1 class="text-2xl font-semibold">Leaderboard</h1>
      <p class="text-sm text-muted-foreground">Top coders ranked by total tracked time</p>
    </div>

    <!-- Combined Error State -->
    <div
      v-if="isLeaderboardError || isUserError"
      class="flex flex-col items-center gap-4 rounded-lg border border-destructive/50 bg-destructive/10 p-8"
    >
      <AlertCircle class="h-12 w-12 text-destructive" />
      <div class="text-center">
        <p class="font-medium text-destructive">Failed to load leaderboard</p>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ getCombinedErrorMessage() }}
        </p>
      </div>
      <Button variant="outline" size="sm" @click="retryAll">
        <RefreshCw class="h-4 w-4" />
        Retry
      </Button>
    </div>

    <!-- Loading State -->
    <div v-else-if="isLeaderboardPending || isUserPending" class="flex flex-col gap-4">
      <!-- User position skeleton -->
      <Skeleton class="h-20 w-full rounded-lg" />
      <!-- Leaderboard entries skeleton -->
      <div v-for="i in 5" :key="i" class="flex items-center gap-4 rounded-lg border p-4">
        <Skeleton class="h-8 w-8 rounded-full" />
        <Skeleton class="h-10 w-10 rounded-full" />
        <div class="flex flex-1 flex-col gap-2">
          <Skeleton class="h-4 w-32" />
          <Skeleton class="h-3 w-20" />
        </div>
        <Skeleton class="h-6 w-16" />
      </div>
    </div>

    <!-- Content State -->
    <template v-else>
      <!-- User Position Card -->
      <div v-if="userPosition" class="rounded-lg border bg-muted/50 p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <User class="h-5 w-5 text-primary" />
          </div>
          <div class="flex flex-1 flex-col gap-1">
            <span class="text-sm font-medium">Your Position</span>
            <span class="text-xs text-muted-foreground">
              Rank #{{ userPosition.rank }} · {{ formatTime(userPosition.totalMinutes) }} total
            </span>
          </div>
          <Badge variant="outline"> #{{ userPosition.rank }} </Badge>
        </div>
      </div>

      <!-- Leaderboard Entries -->
      <div v-if="leaderboard?.entries && leaderboard.entries.length > 0" class="flex flex-col gap-2">
        <div
          v-for="entry in leaderboard.entries"
          :key="entry.userId"
          class="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
        >
          <!-- Rank -->
          <div class="flex h-8 w-8 shrink-0 items-center justify-center text-lg">
            {{ getRankIcon(entry.rank) }}
          </div>

          <!-- Avatar Placeholder -->
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
            <Trophy class="h-5 w-5 text-muted-foreground" />
          </div>

          <!-- User Info -->
          <div class="flex flex-1 flex-col gap-1">
            <span class="font-medium">{{ entry.displayName }}</span>
            <span class="text-xs text-muted-foreground"> {{ formatTime(entry.totalMinutes) }} tracked </span>
          </div>

          <!-- Rank Badge -->
          <Badge :variant="getRankBadgeVariant(entry.rank)"> #{{ entry.rank }} </Badge>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="flex flex-col items-center gap-4 rounded-lg border p-12">
        <Trophy class="h-12 w-12 text-muted-foreground" />
        <div class="text-center">
          <p class="font-medium">No leaderboard data</p>
          <p class="mt-1 text-sm text-muted-foreground">
            Start tracking your coding time to appear on the leaderboard.
          </p>
        </div>
      </div>
    </template>
  </div>
</template>
