<script setup lang="ts">
/**
 * DistributionPanel — a dashboard panel for one distribution dimension.
 *
 * Wraps ChartSection with the dimension's query wired up (loading / error /
 * empty states drive the panel). The chart body is a later pass; the slot
 * area below is the reserved mount point.
 *
 * Dimensions map 1:1 to the backend DistributionType enum (LANGUAGES,
 * PROJECTS, TIME_OF_DAY, WEEKDAY, DEVICES, IDES) so the plugin panel set is
 * fully covered.
 */
import { computed } from 'vue'
import { useStatsDistribution } from '@/composables/useStats'
import ChartSection from './ChartSection.vue'

const props = defineProps<{
  /** Backend distribution dimension this panel renders */
  type: 'LANGUAGES' | 'PROJECTS' | 'TIME_OF_DAY' | 'WEEKDAY' | 'DEVICES' | 'IDES'
  /** Panel heading shown above the content */
  title: string
  /** Origin-device filter (null → all devices) */
  deviceId: string | null
  /** Exact IDE-name filter (null → all IDEs); mutually exclusive with deviceId */
  ideName: string | null
}>()

// The type is fixed per panel instance; the device filter stays reactive.
const type = props.type
const distribution = useStatsDistribution(
  type,
  computed(() => ({
    deviceId: props.deviceId ?? undefined,
    ideName: props.ideName ?? undefined,
  })),
)

const isEmpty = computed(() => !!distribution.data.value && distribution.data.value.entries.length === 0)
</script>

<template>
  <ChartSection
    :title="title"
    :loading="distribution.isPending.value"
    :error="distribution.isError.value"
    :empty="isEmpty"
    @retry="() => distribution.refetch()"
  >
    <!-- Chart mount point: pie / bar per dimension (reserved for a later pass) -->
    <div class="py-8 text-center text-sm text-muted-foreground">{{ title }} chart</div>
  </ChartSection>
</template>
