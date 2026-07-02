<script setup lang="ts">
/**
 * UserAvatar - Round circle avatar with first letter, hash-colored background
 *
 * Designed to slot into the right side of the AppHeader. Reads displayName
 * (preferred, for readable initials) and userId (fallback, UUID) from
 * useAuthStore. Generates a deterministic hash-based color and renders
 * the first letter(s) of the display name. Falls back to "?" when no user
 * is logged in.
 *
 * Visual: 36px circle, white text on HSL hash color, semantic label
 * for screen readers.
 */
import { computed } from 'vue'
import { stringToAvatarColor, getInitials } from '@/lib/utils/avatar'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

/**
 * Seed for hash AND initials source.
 *
 * Priority: displayName > userId > 'guest'
 * - displayName (human-readable) gives readable initials like "AB" for "Alice Bob"
 * - userId (UUID) is stable and collision-free, used as fallback before profile loads
 * - 'guest' is the anonymous default
 *
 * The djb2 hash on this seed produces a deterministic HSL hue so the same
 * user always gets the same color across sessions, regardless of whether
 * the profile has loaded yet (seeded by userId) or finished loading
 * (seeded by displayName — both are stable identifiers for the same user).
 */
const seed = computed(() => {
  const name = authStore.displayName ?? authStore.userId
  return name ?? 'guest'
})

/**
 * Background: hash-derived HSL color (same user → same color).
 *
 * Initials use the same seed. When displayName is set, getInitials extracts
 * real initials ("Alice Bob" → "AB"). When only userId is set, getInitials
 * returns the first character of the UUID chunk (handled gracefully).
 */
const background = computed(() => stringToAvatarColor(seed.value))
const initials = computed(() => getInitials(seed.value))
</script>

<template>
  <span
    :style="{ background }"
    class="inline-flex h-9 w-9 items-center justify-center rounded-full font-semibold text-white select-none shrink-0 leading-none"
    :aria-label="`User avatar for ${seed}`"
    role="img"
  >
    {{ initials }}
  </span>
</template>
