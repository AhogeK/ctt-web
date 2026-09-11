<script setup lang="ts">
/**
 * ProjectDistributionPanel — "Project distribution": every project coded in the
 * selected window, ranked by time (plugin parity: the JetBrains plugin's
 * `projectDistribution` panel).
 *
 * Ranked horizontal bars, not a donut (the plugin's form): a project name is
 * long and variable, and rank is the thing being read. Bar length makes the
 * ordering unambiguous, the label column keeps every name on one axis, and long
 * names stay recoverable on hover instead of being truncated inside a legend.
 *
 * It shares `useRankedDistribution` and `RankedDistributionList` with the
 * language panel, so both dimensions agree on ranking, the 0.1% folding floor,
 * the shared gradient and the percent precision by construction.
 *
 * Projects are the categorical family — same-second work in two projects counts
 * once per project, so the bucket sum is legitimately ≥ the real activity and no
 * Total is printed.
 *
 * Data: GET /stats/distribution?type=PROJECTS — entries {name, seconds} ordered
 * by duration descending (ctt-server v0.66.0 window params).
 * Loading / error / empty shell lives in the parent ChartSection.
 */
import { computed } from 'vue'
import { useStatsDistribution } from '@/composables/useStats'
import { useRankedDistribution } from '../composables/useRankedDistribution'
import RankedDistributionList from './RankedDistributionList.vue'
import { formatPercent } from '@/lib/utils'

const props = defineProps<{
  /** Inclusive window start (yyyy-MM-dd); omitted = full history */
  start?: string
  /** Inclusive window end (yyyy-MM-dd); omitted = full history */
  end?: string
  /** Origin-device filter (null → all devices) */
  deviceId: string | null
  /** Exact IDE-name filter (null → all IDEs); mutually exclusive with deviceId */
  ideName: string | null
}>()

const distribution = useStatsDistribution(
  'PROJECTS',
  computed(() => ({
    start: props.start,
    end: props.end,
    deviceId: props.deviceId ?? undefined,
    ideName: props.ideName ?? undefined,
  })),
)

const entries = computed(() => distribution.data.value?.entries ?? [])
const { rows } = useRankedDistribution(entries, { aggregateLabel: 'Others' })

const projectCount = computed(() => rows.value.length)

const ariaLabel = computed(() => {
  const parts = rows.value.map((r) => `${r.name} ${formatPercent(r.percent)}%`).join(', ')
  return `Project distribution, bar length is coding time: ${parts}`
})
</script>

<template>
  <RankedDistributionList :rows="rows" :a11y-label="ariaLabel" fold-noun="projects">
    <template #footer> {{ projectCount }} {{ projectCount === 1 ? 'project' : 'projects' }} </template>
  </RankedDistributionList>
</template>
