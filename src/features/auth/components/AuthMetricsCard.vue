<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useTransition } from '@vueuse/core'

/**
 * Animated counter metric for the auth page metrics ticker card.
 * Displays a title, animated numeric value with optional unit, and icon.
 */
interface MetricItem {
  /** Display title for the metric (e.g., "Total Hours") */
  title: string
  /** Target numeric value to animate to */
  value: number
  /** Optional unit suffix (e.g., "h", "d", "%") */
  unit?: string
  /** Optional icon emoji or SVG string */
  icon?: string
  /** CSS color modifier class for the value */
  colorClass?: string
}

const props = withDefaults(
  defineProps<{
    /** Array of metric items to display as animated counters */
    metrics?: MetricItem[]
    /** Sparkline data: array of percentage heights (0-100) */
    sparklineData?: number[]
    /** Sparkline label text */
    sparklineLabel?: string
    /** Language distribution data */
    languages?: { name: string; pct: number; colorClass: string }[]
  }>(),
  {
    metrics: () => [
      { title: 'Total Hours', value: 342, unit: 'h' },
      { title: 'Commits', value: 2400, colorClass: 'auth-metrics__counter-value--accent' },
      { title: 'Streak', value: 12, unit: 'd', colorClass: 'auth-metrics__counter-value--green' },
    ],
    sparklineData: () => [35, 55, 20, 70, 45, 85, 60, 40, 90, 50, 75, 30],
    sparklineLabel: 'Weekly Activity',
    languages: () => [
      { name: 'TypeScript', pct: 68, colorClass: 'auth-metrics__lang-bar-fill--indigo' },
      { name: 'Vue', pct: 18, colorClass: 'auth-metrics__lang-bar-fill--violet' },
      { name: 'Rust', pct: 14, colorClass: 'auth-metrics__lang-bar-fill--green' },
    ],
  },
)

/** Source refs that drive the animated transitions for each metric */
const metricSources = props.metrics.map(() => ref(0))

/** Smooth number transitions using VueUse useTransition with easeOutQuart curve */
const animatedValues = metricSources.map((source) =>
  useTransition(source, {
    duration: 1500,
    transition: [0.25, 0.1, 0.25, 1],
  }),
)

/** Trigger counter animations on mount by setting source values */
onMounted(() => {
  props.metrics.forEach((metric, i) => {
    metricSources[i]!.value = metric.value
  })
})

/** Format animated value: integer if whole number, otherwise 1 decimal */
function formatValue(rawValue: number, unit?: string): string {
  const num = Math.round(rawValue)
  return unit ? `${num}${unit}` : `${num}`
}
</script>

<template>
  <div class="auth-card-3d auth-card-3d--metrics">
    <div class="auth-card-3d__inner auth-card-3d__metrics-inner">
      <div class="auth-card-3d__header">
        <span class="auth-card-3d__title">Live Metrics</span>
        <span class="auth-card-3d__badge auth-card-3d__badge--live">
          <span class="auth-card-3d__badge-dot" />
          Live
        </span>
      </div>

      <!-- Animated Counters Row -->
      <div class="auth-metrics__counters">
        <div v-for="(metric, i) in props.metrics" :key="metric.title" class="auth-metrics__counter">
          <span class="auth-metrics__counter-value" :class="metric.colorClass">
            {{ formatValue(animatedValues[i]!.value, metric.unit) }}
          </span>
          <span class="auth-metrics__counter-label">{{ metric.title }}</span>
        </div>
      </div>

      <!-- Sparkline: Weekly Activity -->
      <div class="auth-metrics__sparkline">
        <span class="auth-metrics__sparkline-label">{{ props.sparklineLabel }}</span>
        <div class="auth-metrics__sparkline-bars">
          <div
            v-for="(level, i) in props.sparklineData"
            :key="i"
            class="auth-metrics__sparkline-bar"
            :style="{ height: `${level}%` }"
          />
        </div>
      </div>

      <!-- Language Distribution Bars -->
      <div class="auth-metrics__languages">
        <div v-for="lang in props.languages" :key="lang.name" class="auth-metrics__lang">
          <span class="auth-metrics__lang-name">{{ lang.name }}</span>
          <div class="auth-metrics__lang-bar-track">
            <div
              class="auth-metrics__lang-bar-fill"
              :class="lang.colorClass"
              :style="{ width: `${lang.pct}%` }"
            />
          </div>
          <span class="auth-metrics__lang-pct">{{ lang.pct }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>
