<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useTransition } from '@vueuse/core'
import { useCardTilt } from '@/composables/useCardTilt'

const tilt = useCardTilt({
  intensity: 8,
  baseRotateX: 10,
  baseRotateY: -15,
  baseRotateZ: 2,
  translateZ: 0,
  depthMultiplier: 0.8,
})

/** Sparkline data: 12 weeks of activity levels (percentage heights) */
const sparklineData = [35, 55, 20, 70, 45, 85, 60, 40, 90, 50, 75, 30]

/** Animated counter targets */
const targetHours = 342
const targetProjects = 28
const targetStreak = 12

/** Source refs that drive the animated transitions */
const hoursSource = ref(0)
const projectsSource = ref(0)
const streakSource = ref(0)

/** Spring-like overshoot cubic-bezier for premium feel */
const springEasing: [number, number, number, number] = [0.34, 1.56, 0.64, 1]

/** Smooth number transitions using VueUse useTransition with custom cubic-bezier curve */
const animatedHoursRaw = useTransition(hoursSource, {
  duration: 1500,
  easing: springEasing,
})

const animatedProjectsRaw = useTransition(projectsSource, {
  duration: 1500,
  easing: springEasing,
})

const animatedStreakRaw = useTransition(streakSource, {
  duration: 1500,
  easing: springEasing,
})

/** Round to integers for clean display during animation */
const animatedHours = computed(() => Math.round(animatedHoursRaw.value))
const animatedProjects = computed(() => Math.round(animatedProjectsRaw.value))
const animatedStreak = computed(() => Math.round(animatedStreakRaw.value))

/** Trigger counter animations on mount with staggered delays */
onMounted(() => {
  hoursSource.value = targetHours
  setTimeout(() => {
    projectsSource.value = targetProjects
  }, 150)
  setTimeout(() => {
    streakSource.value = targetStreak
  }, 300)
})
</script>

<template>
  <div
    class="auth-card-3d auth-card-3d--metrics"
    @mousemove="tilt.handleMouseMove"
    @mouseenter="tilt.handleMouseEnter"
    @mouseleave="tilt.handleMouseLeave"
    :style="{
      transform: tilt.transform.value,
      '--sheen-x': tilt.sheenX.value,
      '--sheen-y': tilt.sheenY.value,
    }"
  >
    <div class="auth-card-3d__sheen" />
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
        <div class="auth-metrics__counter">
          <span class="auth-metrics__counter-value">{{ animatedHours }}h</span>
          <span class="auth-metrics__counter-label">Total Hours</span>
        </div>
        <div class="auth-metrics__counter">
          <span class="auth-metrics__counter-value auth-metrics__counter-value--accent">{{
            animatedProjects
          }}</span>
          <span class="auth-metrics__counter-label">Projects</span>
        </div>
        <div class="auth-metrics__counter">
          <span class="auth-metrics__counter-value auth-metrics__counter-value--green"
            >{{ animatedStreak }}d</span
          >
          <span class="auth-metrics__counter-label">Streak</span>
        </div>
      </div>

      <!-- Sparkline: Weekly Activity -->
      <div class="auth-metrics__sparkline">
        <span class="auth-metrics__sparkline-label">Weekly Activity</span>
        <div class="auth-metrics__sparkline-bars">
          <div
            v-for="(level, i) in sparklineData"
            :key="i"
            class="auth-metrics__sparkline-bar"
            :style="{ height: `${level}%` }"
          />
        </div>
      </div>

      <!-- Language Distribution Bars -->
      <div class="auth-metrics__languages">
        <div class="auth-metrics__lang">
          <span class="auth-metrics__lang-name">TypeScript</span>
          <div class="auth-metrics__lang-bar-track">
            <div
              class="auth-metrics__lang-bar-fill auth-metrics__lang-bar-fill--indigo"
              style="width: 68%"
            />
          </div>
          <span class="auth-metrics__lang-pct">68%</span>
        </div>
        <div class="auth-metrics__lang">
          <span class="auth-metrics__lang-name">Vue</span>
          <div class="auth-metrics__lang-bar-track">
            <div
              class="auth-metrics__lang-bar-fill auth-metrics__lang-bar-fill--violet"
              style="width: 18%"
            />
          </div>
          <span class="auth-metrics__lang-pct">18%</span>
        </div>
        <div class="auth-metrics__lang">
          <span class="auth-metrics__lang-name">Rust</span>
          <div class="auth-metrics__lang-bar-track">
            <div
              class="auth-metrics__lang-bar-fill auth-metrics__lang-bar-fill--green"
              style="width: 14%"
            />
          </div>
          <span class="auth-metrics__lang-pct">14%</span>
        </div>
      </div>
    </div>
  </div>
</template>
