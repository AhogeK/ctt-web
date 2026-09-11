<script setup lang="ts">
/**
 * LanguageDistributionPanel — "Language distribution": every language coded in
 * the selected window, ranked by time.
 *
 * The panel owns its query and its copy; the row model comes from
 * `useRankedDistribution` and the rendering from `RankedDistributionList`, which
 * the project panel uses too. That sharing is deliberate — the ranking, folding,
 * gradient and precision rules are identical for both dimensions, and two copies
 * would drift.
 *
 * Bar length is scaled to the longest language, so the top row spans the full
 * track no matter how dominant or flat the distribution is. Every language above
 * the 0.1% floor is listed (no row cap: the card bounds its height, not the
 * data); the negligible tail folds into an aggregate row that names every entry
 * it swallowed on hover. Categorical distributions are super-linear, so no Total
 * is printed — that number has no meaning here.
 *
 * Data: GET /stats/distribution?type=LANGUAGES — entries {name, seconds}
 * ordered by duration descending (ctt-server v0.66.0 window params).
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
  'LANGUAGES',
  computed(() => ({
    start: props.start,
    end: props.end,
    deviceId: props.deviceId ?? undefined,
    ideName: props.ideName ?? undefined,
  })),
)

const entries = computed(() => distribution.data.value?.entries ?? [])
const { rows } = useRankedDistribution(entries, { aggregateLabel: 'Others' })

const languageCount = computed(() => rows.value.length)

const ariaLabel = computed(() => {
  const parts = rows.value.map((r) => `${r.name} ${formatPercent(r.percent)}%`).join(', ')
  return `Language distribution, bar length is coding time: ${parts}`
})
</script>

<template>
  <RankedDistributionList :rows="rows" :a11y-label="ariaLabel" fold-noun="languages">
    <template #footer> {{ languageCount }} {{ languageCount === 1 ? 'language' : 'languages' }} </template>
  </RankedDistributionList>
</template>
