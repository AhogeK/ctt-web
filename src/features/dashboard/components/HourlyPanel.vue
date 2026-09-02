<script setup lang="ts">
/**
 * HourlyPanel — per-hour average coding duration.
 *
 * Wraps ChartSection with the hourly query wired up (loading / error / empty
 * states drive the panel). The per-hour bar chart (plugin panels "Weekly
 * Coding Activity by Hour" / "Average Hourly Coding Duration") is a later
 * pass; the slot area below is the reserved mount point.
 */
import { computed } from 'vue'
import { useStatsHourly } from '@/composables/useStats'
import ChartSection from './ChartSection.vue'

const props = defineProps<{
  /** Origin-device filter (null → all devices) */
  deviceId: string | null
  /** Exact IDE-name filter (null → all IDEs); mutually exclusive with deviceId */
  ideName: string | null
}>()

const hourly = useStatsHourly(
  computed(() => ({
    deviceId: props.deviceId ?? undefined,
    ideName: props.ideName ?? undefined,
  })),
)

const isEmpty = computed(() => !!hourly.data.value && hourly.data.value.points.length === 0)
</script>

<template>
  <ChartSection
    title="Average hourly coding duration"
    :loading="hourly.isPending.value"
    :error="hourly.isError.value"
    :empty="isEmpty"
    @retry="() => hourly.refetch()"
  >
    <!-- Chart mount point: per-hour bar chart (reserved for a later pass) -->
    <div class="flex min-h-36 items-center justify-center text-sm text-muted-foreground">Hourly chart</div>
  </ChartSection>
</template>
