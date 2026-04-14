<script setup lang="ts">
import { useCardTilt } from '@/composables/useCardTilt'

const tilt = useCardTilt({
  intensity: 6,
  baseRotateX: 15,
  baseRotateY: -20,
  baseRotateZ: -3,
  translateZ: 40,
  depthMultiplier: 1.2,
})

/** Generate heatmap level (0-3) from a deterministic pattern */
function heatmapLevel(row: number, col: number): number {
  const pattern = [
    [0, 1, 2, 0, 3, 1, 0],
    [1, 0, 3, 2, 0, 1, 2],
    [2, 3, 1, 0, 2, 3, 1],
    [0, 1, 0, 3, 1, 0, 2],
    [3, 2, 1, 0, 3, 2, 0],
    [1, 0, 2, 1, 0, 3, 1],
    [2, 3, 0, 2, 1, 0, 3],
    [0, 1, 3, 0, 2, 1, 0],
    [1, 2, 0, 3, 0, 2, 1],
    [3, 0, 1, 2, 3, 0, 2],
    [0, 3, 2, 1, 0, 1, 3],
    [2, 1, 0, 3, 1, 2, 0],
    [1, 0, 3, 0, 2, 3, 1],
    [0, 2, 1, 3, 0, 1, 2],
    [3, 1, 2, 0, 1, 0, 3],
    [1, 3, 0, 2, 3, 1, 0],
    [2, 0, 1, 3, 0, 2, 1],
    [0, 2, 3, 1, 2, 0, 3],
    [1, 3, 0, 2, 1, 3, 2],
    [3, 1, 2, 0, 3, 1, 0],
  ]
  return pattern[col]?.[row] ?? 0
}
</script>

<template>
  <div
    class="auth-dashboard"
    @mousemove="tilt.handleMouseMove"
    @mouseenter="tilt.handleMouseEnter"
    @mouseleave="tilt.handleMouseLeave"
    :style="{
      transform: tilt.transform.value,
      '--sheen-x': tilt.sheenX.value,
      '--sheen-y': tilt.sheenY.value,
    }"
  >
    <div class="auth-dashboard__sheen" />
    <!-- Browser Chrome -->
    <div class="auth-dashboard__chrome">
      <div class="auth-dashboard__traffic">
        <span class="auth-dashboard__dot auth-dashboard__dot--red" />
        <span class="auth-dashboard__dot auth-dashboard__dot--yellow" />
        <span class="auth-dashboard__dot auth-dashboard__dot--green" />
      </div>
      <div class="auth-dashboard__url">
        <svg class="auth-dashboard__lock" width="10" height="12" viewBox="0 0 10 12" fill="none">
          <rect x="1" y="5" width="8" height="6" rx="1" stroke="currentColor" stroke-width="1.2" />
          <path
            d="M3 5V3.5C3 2.12 3.9 1 5 1s2 1.12 2 2.5V5"
            stroke="currentColor"
            stroke-width="1.2"
          />
        </svg>
        <span>app.codetime.dev/dashboard</span>
      </div>
    </div>

    <!-- Dashboard Content -->
    <div class="auth-dashboard__content">
      <!-- Dashboard Header -->
      <div class="auth-dashboard__header">
        <div class="auth-dashboard__logo">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect width="16" height="16" rx="4" fill="#5e6ad2" />
            <path d="M4 8h8M8 4v8" stroke="#fff" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </div>
        <span class="auth-dashboard__title">Code Time Tracker</span>
      </div>

      <!-- Heatmap Grid (12 weeks x 7 days) -->
      <div class="auth-dashboard__heatmap">
        <div v-for="col in 12" :key="col" class="auth-dashboard__heatmap-col">
          <div
            v-for="row in 7"
            :key="row"
            class="auth-dashboard__heatmap-cell"
            :class="`level-${heatmapLevel(row - 1, col - 1)}`"
          />
        </div>
      </div>

      <!-- Stats Row -->
      <div class="auth-dashboard__stats">
        <div class="auth-dashboard__stat">
          <span class="auth-dashboard__stat-value">342h</span>
          <span class="auth-dashboard__stat-label">Total Time</span>
        </div>
        <div class="auth-dashboard__stat">
          <span class="auth-dashboard__stat-value auth-dashboard__stat-value--accent">TS 68%</span>
          <span class="auth-dashboard__stat-label">Top Language</span>
        </div>
        <div class="auth-dashboard__stat">
          <span class="auth-dashboard__stat-value auth-dashboard__stat-value--green">12 days</span>
          <span class="auth-dashboard__stat-label">Streak</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Reflection beneath dashboard -->
  <div class="auth-dashboard__reflection" />
</template>
