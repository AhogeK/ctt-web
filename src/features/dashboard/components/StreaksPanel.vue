<script setup lang="ts">
/**
 * StreaksPanel — current and longest coding streaks.
 *
 * Wraps ChartSection with the streaks query wired up (loading / error states
 * drive the panel). The streak calendar visual is a later pass; the slot
 * area below is the reserved mount point.
 */
import { computed } from 'vue'
import { useStatsStreaks } from '@/composables/useStats'
import ChartSection from './ChartSection.vue'

const props = defineProps<{
  /** Origin-device filter (null → all devices) */
  deviceId: string | null
  /** Exact IDE-name filter (null → all IDEs); mutually exclusive with deviceId */
  ideName: string | null
}>()

const streaks = useStatsStreaks(
  computed(() => ({
    deviceId: props.deviceId ?? undefined,
    ideName: props.ideName ?? undefined,
  })),
)

// A user with no recorded sessions has no streaks to show; both zero is the
// backend's resolved shape (never undefined), so 0/0 is the empty state.
const isEmpty = computed(() => {
  const d = streaks.data.value
  return !!d && d.current === 0 && d.max === 0
})
</script>

<template>
  <ChartSection
    title="Coding streaks"
    :loading="streaks.isPending.value"
    :error="streaks.isError.value"
    :empty="isEmpty"
    @retry="() => streaks.refetch()"
  >
    <!-- Chart mount point: streak calendar strip (reserved for a later pass) -->
    <div class="py-8 text-center text-sm text-muted-foreground">Streak calendar</div>
  </ChartSection>
</template>
