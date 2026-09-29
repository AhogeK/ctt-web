<script setup lang="ts">
/**
 * SummaryCards — the overview row of the dashboard.
 *
 * Owns the query and nothing else: it maps the backend's six summary fields onto
 * `SummaryStatGrid`, which holds the markup (so the marketing hero can render the same cards from
 * its own example data without a query client).
 *
 * Cards surface a retry action on failure without blocking the rest of the row.
 */
import { computed } from 'vue'
import { useStatsSummary } from '@/composables/useStats'
import SummaryStatGrid from './SummaryStatGrid.vue'
import { SUMMARY_STAT_FIELDS, type SummaryStatItem } from './summary-stat-fields'

const props = defineProps<{
  /** Origin-device filter (null → all devices) */
  deviceId: string | null
  /** Exact IDE-name filter (null → all IDEs); mutually exclusive with deviceId */
  ideName: string | null
}>()

const { data, isPending, isError, refetch } = useStatsSummary(
  computed(() => ({
    deviceId: props.deviceId ?? undefined,
    ideName: props.ideName ?? undefined,
  })),
)

const items = computed<SummaryStatItem[]>(() =>
  SUMMARY_STAT_FIELDS.map((field) => ({
    label: field.label,
    icon: field.icon,
    seconds: data.value?.[field.key] ?? 0,
  })),
)

// While pending or after a failed request there is no value to show yet.
const showPlaceholder = computed(() => isPending.value || !data.value)
</script>

<template>
  <SummaryStatGrid :items="items" :placeholder="showPlaceholder" :error="Boolean(isError)" @retry="refetch()" />
</template>
