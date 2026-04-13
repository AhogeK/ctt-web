<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { onMounted, ref } from 'vue'
import { RouterView } from 'vue-router'
import { useTransition } from '@vueuse/core'
import { cn } from '@/lib/utils'
import ThemeToggle from '@/components/app/ThemeToggle.vue'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

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

// --- Metrics Ticker Card ---

/** Sparkline data: 12 weeks of activity levels (percentage heights) */
const sparklineData = [35, 55, 20, 70, 45, 85, 60, 40, 90, 50, 75, 30]

/** Animated counter targets */
const targetHours = 342
const targetCommits = 2400
const targetStreak = 12

/** Source refs that drive the animated transitions */
const hoursSource = ref(0)
const commitsSource = ref(0)
const streakSource = ref(0)

/** Smooth number transitions using VueUse useTransition with easeOutQuart curve */
const animatedHours = useTransition(hoursSource, {
  duration: 1500,
  transition: [0.25, 0.1, 0.25, 1],
})

const animatedCommits = useTransition(commitsSource, {
  duration: 1500,
  transition: [0.25, 0.1, 0.25, 1],
})

const animatedStreak = useTransition(streakSource, {
  duration: 1500,
  transition: [0.25, 0.1, 0.25, 1],
})

/** Trigger counter animations on mount by setting source values */
onMounted(() => {
  hoursSource.value = targetHours
  commitsSource.value = targetCommits
  streakSource.value = targetStreak
})
</script>

<template>
  <div
    :class="cn('auth-root flex h-screen items-center justify-center overflow-hidden', props.class)"
  >
    <!-- Animated Mesh Gradient Background -->
    <div class="auth-background" />

    <!-- SVG Noise Texture Overlay -->
    <div class="auth-noise">
      <svg width="100%" height="100%">
        <filter id="noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="4"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>
    </div>

    <!-- Floating Gradient Orbs -->
    <div class="auth-orbs">
      <div class="auth-orb auth-orb--1" />
      <div class="auth-orb auth-orb--2" />
      <div class="auth-orb auth-orb--3" />
      <div class="auth-orb auth-orb--4" />
      <div class="auth-orb auth-orb--5" />
      <div class="auth-orb auth-orb--6" />
    </div>

    <!-- Main Glass-Morphism Card -->
    <div class="auth-card">
      <div class="auth-card__inner">
        <!-- Left Panel: Isometric Dashboard + 3D Cards -->
        <div class="auth-visual">
          <div class="auth-visual__dots" />

          <!-- Isometric Dashboard Mockup -->
          <div class="auth-dashboard">
            <!-- Browser Chrome -->
            <div class="auth-dashboard__chrome">
              <div class="auth-dashboard__traffic">
                <span class="auth-dashboard__dot auth-dashboard__dot--red" />
                <span class="auth-dashboard__dot auth-dashboard__dot--yellow" />
                <span class="auth-dashboard__dot auth-dashboard__dot--green" />
              </div>
              <div class="auth-dashboard__url">
                <svg
                  class="auth-dashboard__lock"
                  width="10"
                  height="12"
                  viewBox="0 0 10 12"
                  fill="none"
                >
                  <rect
                    x="1"
                    y="5"
                    width="8"
                    height="6"
                    rx="1"
                    stroke="currentColor"
                    stroke-width="1.2"
                  />
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
                    <path
                      d="M4 8h8M8 4v8"
                      stroke="#fff"
                      stroke-width="1.5"
                      stroke-linecap="round"
                    />
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
                  <span class="auth-dashboard__stat-value auth-dashboard__stat-value--accent"
                    >TS 68%</span
                  >
                  <span class="auth-dashboard__stat-label">Top Language</span>
                </div>
                <div class="auth-dashboard__stat">
                  <span class="auth-dashboard__stat-value auth-dashboard__stat-value--green"
                    >12 days</span
                  >
                  <span class="auth-dashboard__stat-label">Streak</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Reflection beneath dashboard -->
          <div class="auth-dashboard__reflection" />

          <!-- 3D Floating Cards Below Dashboard -->
          <div class="auth-cards-container">
            <!-- Metrics Ticker Card -->
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
                  <div class="auth-metrics__counter">
                    <span class="auth-metrics__counter-value">{{ animatedHours }}h</span>
                    <span class="auth-metrics__counter-label">Total Hours</span>
                  </div>
                  <div class="auth-metrics__counter">
                    <span class="auth-metrics__counter-value auth-metrics__counter-value--accent">{{
                      animatedCommits
                    }}</span>
                    <span class="auth-metrics__counter-label">Commits</span>
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

            <!-- Terminal Card -->
            <div class="auth-card-3d auth-card-3d--terminal">
              <div class="auth-card-3d__inner auth-card-3d__terminal-inner">
                <div class="auth-terminal__header">
                  <div class="auth-terminal__dots">
                    <span class="auth-terminal__dot auth-terminal__dot--red" />
                    <span class="auth-terminal__dot auth-terminal__dot--yellow" />
                    <span class="auth-terminal__dot auth-terminal__dot--green" />
                  </div>
                  <span class="auth-terminal__title">ctt-stats</span>
                </div>
                <div class="auth-terminal__body">
                  <div class="auth-terminal__line">
                    <span class="auth-terminal__prompt">&gt;</span>
                    <span class="auth-terminal__text"
                      >Total coding time: <span class="auth-terminal__value">342h 15m</span></span
                    >
                  </div>
                  <div class="auth-terminal__line">
                    <span class="auth-terminal__prompt">&gt;</span>
                    <span class="auth-terminal__text"
                      >Top language:
                      <span class="auth-terminal__value--accent">TypeScript (68%)</span></span
                    >
                  </div>
                  <div class="auth-terminal__line">
                    <span class="auth-terminal__prompt">&gt;</span>
                    <span class="auth-terminal__text"
                      >Longest session: <span class="auth-terminal__value">4h 23m</span></span
                    >
                  </div>
                  <div class="auth-terminal__line">
                    <span class="auth-terminal__prompt">&gt;</span>
                    <span class="auth-terminal__text"
                      >Active days: <span class="auth-terminal__value">89/90</span></span
                    >
                  </div>
                  <div class="auth-terminal__line">
                    <span class="auth-terminal__prompt">&gt;</span>
                    <span class="auth-terminal__text"
                      >Current streak: <span class="auth-terminal__streak">12 days</span></span
                    >
                    <span class="auth-terminal__cursor" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Panel: Form Area -->
        <div class="auth-form">
          <!-- Theme Toggle in Header -->
          <div class="auth-form__header">
            <ThemeToggle />
          </div>
          <RouterView />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============================================
   Root & Background
   ============================================ */

.auth-root {
  font-family:
    'Inter Variable',
    SF Pro Display,
    -apple-system,
    system-ui,
    sans-serif;
  font-feature-settings: 'cv01', 'ss03';
}

.auth-background {
  position: fixed;
  inset: 0;
  z-index: -2;
  background:
    radial-gradient(ellipse 80% 60% at 20% 30%, rgba(94, 106, 210, 0.12) 0%, transparent 70%),
    radial-gradient(ellipse 60% 80% at 80% 70%, rgba(113, 112, 255, 0.1) 0%, transparent 70%),
    radial-gradient(ellipse 70% 50% at 50% 50%, rgba(130, 143, 255, 0.08) 0%, transparent 70%),
    #08090a;
  animation: mesh-shift 20s cubic-bezier(0.16, 1, 0.3, 1) infinite;
  background-size: 150% 150%;
}

:root:not(.dark) .auth-background {
  background:
    radial-gradient(ellipse 80% 60% at 20% 30%, rgba(94, 106, 210, 0.06) 0%, transparent 70%),
    radial-gradient(ellipse 60% 80% at 80% 70%, rgba(113, 112, 255, 0.04) 0%, transparent 70%),
    radial-gradient(ellipse 70% 50% at 50% 50%, rgba(130, 143, 255, 0.03) 0%, transparent 70%),
    #f7f8f8;
}

@keyframes mesh-shift {
  0%,
  100% {
    background-position:
      0% 0%,
      100% 100%,
      50% 50%;
  }
  25% {
    background-position:
      10% 10%,
      90% 80%,
      60% 40%;
  }
  50% {
    background-position:
      20% 0%,
      80% 100%,
      40% 60%;
  }
  75% {
    background-position:
      0% 20%,
      100% 70%,
      50% 50%;
  }
}

/* ============================================
   SVG Noise Texture Overlay
   ============================================ */

.auth-noise {
  position: fixed;
  inset: 0;
  z-index: -1;
  opacity: 0.2;
  mix-blend-mode: overlay;
  pointer-events: none;
}

:root:not(.dark) .auth-noise {
  opacity: 0.08;
}

.auth-noise svg {
  width: 100%;
  height: 100%;
}

/* ============================================
   Floating Gradient Orbs
   ============================================ */

.auth-orbs {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}

.auth-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
}

.auth-orb--1 {
  top: 10%;
  left: 15%;
  width: 200px;
  height: 200px;
  background: rgba(94, 106, 210, 0.15);
  animation: orb-drift-1 15s cubic-bezier(0.16, 1, 0.3, 1) infinite;
}

.auth-orb--2 {
  bottom: 15%;
  right: 10%;
  width: 240px;
  height: 240px;
  background: rgba(113, 112, 255, 0.12);
  animation: orb-drift-2 20s cubic-bezier(0.16, 1, 0.3, 1) infinite;
}

.auth-orb--3 {
  top: 50%;
  left: 60%;
  width: 160px;
  height: 160px;
  background: rgba(130, 143, 255, 0.1);
  animation: orb-drift-3 25s cubic-bezier(0.16, 1, 0.3, 1) infinite;
}

.auth-orb--4 {
  top: 25%;
  right: 25%;
  width: 180px;
  height: 180px;
  background: rgba(94, 106, 210, 0.08);
  animation: orb-drift-4 18s cubic-bezier(0.16, 1, 0.3, 1) infinite;
}

.auth-orb--5 {
  bottom: 40%;
  left: 5%;
  width: 350px;
  height: 350px;
  background: rgba(113, 112, 255, 0.08);
  animation: orb-drift-5 22s cubic-bezier(0.16, 1, 0.3, 1) infinite;
}

.auth-orb--6 {
  top: 70%;
  right: 40%;
  width: 180px;
  height: 180px;
  background: rgba(130, 143, 255, 0.12);
  animation: orb-drift-6 16s cubic-bezier(0.16, 1, 0.3, 1) infinite;
}

/* Light mode orbs: warm sunset tones for depth on white canvas */
:root:not(.dark) .auth-orb--1 {
  background: rgba(255, 166, 72, 0.1);
}
:root:not(.dark) .auth-orb--2 {
  background: rgba(255, 120, 100, 0.08);
}
:root:not(.dark) .auth-orb--3 {
  background: rgba(255, 190, 120, 0.07);
}
:root:not(.dark) .auth-orb--4 {
  background: rgba(255, 140, 80, 0.06);
}
:root:not(.dark) .auth-orb--5 {
  background: rgba(255, 170, 110, 0.06);
}
:root:not(.dark) .auth-orb--6 {
  background: rgba(255, 130, 90, 0.08);
}

@keyframes orb-drift-1 {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -20px) scale(1.05);
  }
  66% {
    transform: translate(-20px, 15px) scale(0.95);
  }
}

@keyframes orb-drift-2 {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(-25px, 30px) scale(1.08);
  }
  66% {
    transform: translate(15px, -25px) scale(0.92);
  }
}

@keyframes orb-drift-3 {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(20px, 25px) scale(1.03);
  }
  66% {
    transform: translate(-30px, -10px) scale(0.97);
  }
}

@keyframes orb-drift-4 {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(-15px, -30px) scale(1.06);
  }
  66% {
    transform: translate(25px, 20px) scale(0.94);
  }
}

@keyframes orb-drift-5 {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(40px, -35px) scale(1.04);
  }
  66% {
    transform: translate(-30px, 25px) scale(0.96);
  }
}

@keyframes orb-drift-6 {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(-20px, 15px) scale(1.07);
  }
  66% {
    transform: translate(25px, -20px) scale(0.93);
  }
}

/* ============================================
   Main Glass-Morphism Card
   ============================================ */

.auth-card {
  position: relative;
  width: 100%;
  max-width: 72rem;
  margin: 1rem;
  border-radius: 1.5rem;
  overflow: hidden;
}

/* Premium Gradient Border — static, no animation */
.auth-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 1.5rem;
  padding: 1.5px;
  background: linear-gradient(
    135deg,
    rgba(94, 106, 210, 0.3),
    rgba(113, 112, 255, 0.15) 40%,
    rgba(130, 143, 255, 0.08) 60%,
    rgba(94, 106, 210, 0.3)
  );
  background-size: 200% 200%;
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  transition:
    background 0.6s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  opacity: 0.7;
  pointer-events: none;
  z-index: 1;
}

.auth-card:hover::before {
  opacity: 1;
  background: linear-gradient(
    135deg,
    rgba(94, 106, 210, 0.6),
    rgba(113, 112, 255, 0.4) 30%,
    rgba(130, 143, 255, 0.5) 50%,
    rgba(113, 112, 255, 0.4) 70%,
    rgba(94, 106, 210, 0.6)
  );
}

:root:not(.dark) .auth-card::before {
  background: linear-gradient(
    135deg,
    rgba(94, 106, 210, 0.2),
    rgba(113, 112, 255, 0.1) 50%,
    rgba(94, 106, 210, 0.2)
  );
  opacity: 0.5;
}

:root:not(.dark) .auth-card:hover::before {
  opacity: 0.8;
  background: linear-gradient(
    135deg,
    rgba(94, 106, 210, 0.4),
    rgba(113, 112, 255, 0.25) 50%,
    rgba(94, 106, 210, 0.4)
  );
}

.auth-card__inner {
  position: relative;
  z-index: 0;
  display: flex;
  min-height: 36rem;
  border-radius: 1.5rem;
  background: rgba(15, 16, 17, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 0 0 1px rgba(0, 0, 0, 0.2),
    0 24px 48px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

/* Light mode: white glass with 4-level shadow elevation system */
:root:not(.dark) .auth-card__inner {
  /* Level 1: Pure white card surface */
  background: rgba(255, 255, 255, 0.95);
  box-shadow:
    /* Inner top highlight — glass edge catch light */
    inset 0 1px 0 rgba(255, 255, 255, 1),
    /* Level 2: Contact shadow — surface touching ground */ 0 1px 1px rgba(0, 0, 0, 0.03),
    0 2px 2px rgba(0, 0, 0, 0.03),
    /* Level 3: Key shadow — primary elevation */ 0 4px 4px rgba(0, 0, 0, 0.04),
    0 8px 8px rgba(0, 0, 0, 0.04),
    /* Level 4: Ambient shadow — deep lift */ 0 16px 24px rgba(0, 0, 0, 0.06),
    0 24px 48px rgba(0, 0, 0, 0.04);
}

/* ============================================
   Left Panel: Visual Area
   ============================================ */

.auth-visual {
  position: relative;
  display: none;
  width: 50%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 2rem;
  perspective: 1000px;
}

@media (min-width: 1024px) {
  .auth-visual {
    display: flex;
  }
}

@keyframes dots-glow {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.auth-visual__dots {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
  animation: dots-glow 5s cubic-bezier(0.16, 1, 0.3, 1) infinite;
}

:root:not(.dark) .auth-visual__dots {
  /* Blueprint grid pattern — subtle crosshatch on light mode */
  background-image:
    linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px),
    radial-gradient(circle, rgba(94, 106, 210, 0.08) 1px, transparent 1px);
  background-size:
    24px 24px,
    24px 24px,
    24px 24px;
  background-position:
    0 0,
    0 0,
    12px 12px;
}

/* Light mode: subtle gradient wash on visual panel for depth */
:root:not(.dark) .auth-visual::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    160deg,
    rgba(255, 166, 72, 0.04) 0%,
    transparent 40%,
    transparent 60%,
    rgba(94, 106, 210, 0.03) 100%
  );
  pointer-events: none;
  z-index: 0;
}

/* Inner highlight on visual panel edge */
:root:not(.dark) .auth-visual::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 1px;
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(0, 0, 0, 0.06) 20%,
    rgba(0, 0, 0, 0.06) 80%,
    transparent
  );
  pointer-events: none;
  z-index: 1;
}

/* ============================================
   Isometric Dashboard Mockup
   ============================================ */

.auth-dashboard {
  position: relative;
  width: 100%;
  max-width: 28rem;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(25, 26, 27, 0.9);
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.1),
    0 16px 32px rgba(0, 0, 0, 0.25);
  transform: perspective(1000px) rotateX(2deg) rotateY(-3deg);
  transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  animation: dashboard-entrance 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  animation-delay: 0.1s;
}

.auth-dashboard:hover {
  transform: perspective(1000px) rotateX(0) rotateY(0);
}

/* Light mode: white dashboard surface with proper elevation + inner highlight */
:root:not(.dark) .auth-dashboard {
  /* Level 2: Elevated surface */
  background: rgba(255, 255, 255, 0.98);
  border-color: #d0d6e0;
  box-shadow:
    /* Inner top highlight — light catching edge */
    inset 0 1px 0 rgba(255, 255, 255, 1),
    /* Contact shadow */ 0 1px 2px rgba(0, 0, 0, 0.04),
    /* Key shadow */ 0 4px 8px rgba(0, 0, 0, 0.06),
    /* Ambient shadow */ 0 16px 32px rgba(0, 0, 0, 0.06);
}

@keyframes dashboard-entrance {
  from {
    opacity: 0;
    transform: perspective(1000px) rotateX(2deg) rotateY(-3deg) translateY(20px);
  }
  to {
    opacity: 1;
    transform: perspective(1000px) rotateX(2deg) rotateY(-3deg) translateY(0);
  }
}

/* Reflection */
.auth-dashboard__reflection {
  position: absolute;
  bottom: -4rem;
  left: 5%;
  right: 5%;
  height: 4rem;
  background: linear-gradient(to bottom, rgba(94, 106, 210, 0.08), transparent);
  filter: blur(8px);
  transform: scaleY(-1);
  opacity: 0.3;
  pointer-events: none;
}

/* Browser Chrome */
.auth-dashboard__chrome {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.875rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(0, 0, 0, 0.2);
}

:root:not(.dark) .auth-dashboard__chrome {
  background: #f3f4f5;
  border-bottom-color: #e6e6e6;
}

.auth-dashboard__traffic {
  display: flex;
  gap: 5px;
}

.auth-dashboard__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.auth-dashboard__dot--red {
  background: #ff5f57;
}
.auth-dashboard__dot--yellow {
  background: #febc2e;
}
.auth-dashboard__dot--green {
  background: #28c840;
}

.auth-dashboard__url {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  background: rgba(255, 255, 255, 0.04);
  font-family:
    'Berkeley Mono',
    ui-monospace,
    SF Mono,
    Menlo,
    monospace;
  font-size: 0.6875rem;
  color: #8a8f98;
  flex: 1;
}

:root:not(.dark) .auth-dashboard__url {
  background: #fff;
  color: #62666d;
}

.auth-dashboard__lock {
  color: #27a644;
  flex-shrink: 0;
}

/* Dashboard Content */
.auth-dashboard__content {
  padding: 1rem;
}

.auth-dashboard__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.auth-dashboard__logo {
  display: flex;
  align-items: center;
}

.auth-dashboard__title {
  font-size: 0.8125rem;
  font-weight: 510;
  color: #f7f8f8;
  letter-spacing: -0.01em;
}

:root:not(.dark) .auth-dashboard__title {
  color: #1a1a2e;
}

/* Dashboard Heatmap */
.auth-dashboard__heatmap {
  display: flex;
  gap: 2px;
  margin-bottom: 0.75rem;
}

.auth-dashboard__heatmap-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.auth-dashboard__heatmap-cell {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 2px;
}

.auth-dashboard__heatmap-cell.level-0 {
  background: rgba(255, 255, 255, 0.04);
}
.auth-dashboard__heatmap-cell.level-1 {
  background: rgba(94, 106, 210, 0.25);
}
.auth-dashboard__heatmap-cell.level-2 {
  background: rgba(94, 106, 210, 0.5);
}
.auth-dashboard__heatmap-cell.level-3 {
  background: rgba(94, 106, 210, 0.8);
}

:root:not(.dark) .auth-dashboard__heatmap-cell.level-0 {
  background: #e6e6e6;
}
:root:not(.dark) .auth-dashboard__heatmap-cell.level-1 {
  background: rgba(94, 106, 210, 0.2);
}
:root:not(.dark) .auth-dashboard__heatmap-cell.level-2 {
  background: rgba(94, 106, 210, 0.45);
}
:root:not(.dark) .auth-dashboard__heatmap-cell.level-3 {
  background: rgba(94, 106, 210, 0.75);
}

/* Stats Row */
.auth-dashboard__stats {
  display: flex;
  gap: 0.5rem;
}

.auth-dashboard__stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0.5rem;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

:root:not(.dark) .auth-dashboard__stat {
  background: #f5f6f7;
  border-color: #e6e6e6;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.8),
    0 1px 2px rgba(0, 0, 0, 0.04);
}

.auth-dashboard__stat-value {
  font-size: 0.75rem;
  font-weight: 590;
  color: #f7f8f8;
  letter-spacing: -0.01em;
}

.auth-dashboard__stat-value--accent {
  color: #7170ff;
}
.auth-dashboard__stat-value--green {
  color: #27a644;
}

:root:not(.dark) .auth-dashboard__stat-value {
  color: #1a1a2e;
}

.auth-dashboard__stat-label {
  font-size: 0.625rem;
  font-weight: 510;
  color: #62666d;
  margin-top: 0.125rem;
}

/* ============================================
   3D Floating Cards Container
   ============================================ */

.auth-cards-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 28rem;
  margin-top: 1.5rem;
  perspective: 1000px;
}

/* ============================================
   3D Card Base
   ============================================ */

.auth-card-3d {
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(25, 26, 27, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.05),
    rgba(0, 0, 0, 0.2) 0 0 12px 0 inset;
  transform: rotateY(-5deg) rotateX(2deg);
  transition:
    transform 0.5s cubic-bezier(0.22, 1, 0.36, 1),
    border-color 0.3s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  opacity: 0;
  animation: card-entrance 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.auth-card-3d:hover {
  transform: rotateY(0) rotateX(0);
  border-color: rgba(94, 106, 210, 0.3);
  box-shadow:
    0 0 0 1px rgba(94, 106, 210, 0.15),
    0 8px 24px rgba(0, 0, 0, 0.3),
    rgba(0, 0, 0, 0.2) 0 0 12px 0 inset;
}

/* Light mode: white glass cards with 4-level shadow elevation + inner highlights */
:root:not(.dark) .auth-card-3d {
  /* Level 2: Elevated surface */
  background: rgba(255, 255, 255, 0.9);
  border-color: #d0d6e0;
  box-shadow:
    /* Inner top highlight */
    inset 0 1px 0 rgba(255, 255, 255, 1),
    /* Contact shadow */ 0 1px 2px rgba(0, 0, 0, 0.03),
    /* Key shadow */ 0 4px 8px rgba(0, 0, 0, 0.06),
    /* Ambient shadow */ 0 8px 16px rgba(0, 0, 0, 0.04);
}

:root:not(.dark) .auth-card-3d:hover {
  border-color: rgba(94, 106, 210, 0.4);
  /* Level 3-4: Higher elevation on hover */
  background: rgba(255, 255, 255, 0.98);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 1),
    0 2px 4px rgba(0, 0, 0, 0.04),
    0 8px 16px rgba(0, 0, 0, 0.08),
    0 16px 32px rgba(0, 0, 0, 0.06);
}

.auth-card-3d--metrics {
  animation-delay: 0.2s;
}
.auth-card-3d--terminal {
  animation-delay: 0.4s;
}

@keyframes card-entrance {
  from {
    opacity: 0;
    transform: rotateY(-5deg) rotateX(2deg) translateY(16px);
  }
  to {
    opacity: 1;
    transform: rotateY(-5deg) rotateX(2deg) translateY(0);
  }
}

.auth-card-3d__inner {
  padding: 0;
}

/* Card Header */
.auth-card-3d__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem 0.625rem;
}

.auth-card-3d__title {
  font-size: 0.8125rem;
  font-weight: 510;
  color: #d0d6e0;
  letter-spacing: -0.01em;
}

:root:not(.dark) .auth-card-3d__title {
  color: #62666d;
}

.auth-card-3d__badge {
  font-size: 0.625rem;
  font-weight: 510;
  color: #62666d;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.03);
}

:root:not(.dark) .auth-card-3d__badge {
  color: #62666d;
  border-color: #d0d6e0;
  background: #f5f6f7;
}

/* ============================================
    Metrics Card (Live Metrics)
    ============================================ */

.auth-card-3d__metrics-inner {
  padding: 0;
}

/* Live badge with pulsing dot */
.auth-card-3d__badge--live {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}

.auth-card-3d__badge-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #27a644;
  animation: badge-pulse 2s cubic-bezier(0.16, 1, 0.3, 1) infinite;
}

@keyframes badge-pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.85);
  }
}

/* Counters Row */
.auth-metrics__counters {
  display: flex;
  gap: 0.75rem;
  padding: 0 1rem;
  margin-bottom: 0.75rem;
}

.auth-metrics__counter {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

:root:not(.dark) .auth-metrics__counter {
  background: #f3f4f5;
  border-color: #e6e6e6;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.8),
    0 1px 2px rgba(0, 0, 0, 0.03);
}

.auth-metrics__counter-value {
  font-size: 1rem;
  font-weight: 590;
  color: #f7f8f8;
  letter-spacing: -0.02em;
}

.auth-metrics__counter-value--accent {
  color: #7170ff;
}
.auth-metrics__counter-value--green {
  color: #27a644;
}

:root:not(.dark) .auth-metrics__counter-value {
  color: #1a1a2e;
}

.auth-metrics__counter-label {
  font-size: 0.625rem;
  font-weight: 510;
  color: #62666d;
  margin-top: 0.125rem;
}

/* Sparkline */
.auth-metrics__sparkline {
  padding: 0 1rem;
  margin-bottom: 0.75rem;
}

.auth-metrics__sparkline-label {
  display: block;
  font-size: 0.625rem;
  font-weight: 510;
  color: #62666d;
  margin-bottom: 0.375rem;
}

.auth-metrics__sparkline-bars {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 32px;
  padding: 0.25rem 0;
}

.auth-metrics__sparkline-bar {
  flex: 1;
  border-radius: 1px;
  background: rgba(94, 106, 210, 0.4);
  transition: background 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.auth-metrics__sparkline-bar:hover {
  background: rgba(94, 106, 210, 0.6);
}

:root:not(.dark) .auth-metrics__sparkline-bar {
  background: rgba(94, 106, 210, 0.3);
}

:root:not(.dark) .auth-metrics__sparkline-bar:hover {
  background: rgba(94, 106, 210, 0.5);
}

/* Language Distribution */
.auth-metrics__languages {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0 1rem 0.875rem;
}

.auth-metrics__lang {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.auth-metrics__lang-name {
  font-size: 0.6875rem;
  font-weight: 510;
  color: #d0d6e0;
  width: 5.5rem;
  flex-shrink: 0;
}

:root:not(.dark) .auth-metrics__lang-name {
  color: #62666d;
}

.auth-metrics__lang-bar-track {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.05);
  overflow: hidden;
}

:root:not(.dark) .auth-metrics__lang-bar-track {
  background: #e6e6e6;
}

.auth-metrics__lang-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

.auth-metrics__lang-bar-fill--indigo {
  background: #5e6ad2;
}
.auth-metrics__lang-bar-fill--violet {
  background: #7170ff;
}
.auth-metrics__lang-bar-fill--green {
  background: #27a644;
}

.auth-metrics__lang-pct {
  font-size: 0.6875rem;
  font-weight: 510;
  color: #8a8f98;
  width: 2.5rem;
  text-align: right;
  flex-shrink: 0;
}

:root:not(.dark) .auth-metrics__lang-pct {
  color: #62666d;
}

/* ============================================
    Terminal Card
    ============================================ */

.auth-card-3d__terminal-inner {
  overflow: hidden;
}

.auth-terminal__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(0, 0, 0, 0.15);
}

:root:not(.dark) .auth-terminal__header {
  background: #f3f4f5;
  border-bottom-color: #e6e6e6;
}

.auth-terminal__dots {
  display: flex;
  gap: 5px;
}

.auth-terminal__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.auth-terminal__dot--red {
  background: #ff5f57;
}
.auth-terminal__dot--yellow {
  background: #febc2e;
}
.auth-terminal__dot--green {
  background: #28c840;
}

.auth-terminal__title {
  font-family:
    'Berkeley Mono',
    ui-monospace,
    SF Mono,
    Menlo,
    monospace;
  font-size: 0.6875rem;
  font-weight: 400;
  color: #62666d;
  margin-left: 0.25rem;
}

.auth-terminal__body {
  padding: 0.75rem 0.875rem 0.875rem;
  font-family:
    'Berkeley Mono',
    ui-monospace,
    SF Mono,
    Menlo,
    monospace;
}

.auth-terminal__line {
  display: flex;
  align-items: baseline;
  gap: 0.375rem;
  line-height: 1.6;
  white-space: nowrap;
}

.auth-terminal__line + .auth-terminal__line {
  margin-top: 0.125rem;
}

.auth-terminal__prompt {
  color: #7170ff;
  font-size: 0.75rem;
  font-weight: 400;
  flex-shrink: 0;
}

.auth-terminal__text {
  font-size: 0.75rem;
  color: #8a8f98;
}

:root:not(.dark) .auth-terminal__text {
  color: #62666d;
}

.auth-terminal__value {
  color: #f7f8f8;
  font-weight: 400;
}

:root:not(.dark) .auth-terminal__value {
  color: #1a1a2e;
}

.auth-terminal__value--accent {
  color: #7170ff;
  font-weight: 400;
}

.auth-terminal__streak {
  color: #27a644;
  font-weight: 400;
}

.auth-terminal__cursor {
  display: inline-block;
  width: 6px;
  height: 14px;
  background: #7170ff;
  margin-left: 2px;
  border-radius: 1px;
  animation: cursor-blink 1.2s step-end infinite;
}

@keyframes cursor-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

/* ============================================
   Right Panel: Form Area
   ============================================ */

.auth-form {
  display: flex;
  width: 100%;
  flex-direction: column;
  justify-content: center;
  padding: 2rem 1.5rem;
}

.auth-form__header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
}

@media (min-width: 640px) {
  .auth-form {
    padding: 3rem 2rem;
  }
}

@media (min-width: 1024px) {
  .auth-form {
    width: 50%;
    padding: 3rem 4rem;
  }
}

/* ============================================
   Reduced Motion Support
   ============================================ */

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .auth-background,
  .auth-orb,
  .auth-dashboard,
  .auth-card-3d,
  .auth-card-3d__badge-dot,
  .auth-terminal__cursor,
  .auth-visual__dots {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }

  .auth-card::before,
  .auth-dashboard,
  .auth-card-3d,
  .auth-metrics__sparkline-bar,
  .auth-metrics__lang-bar-fill {
    transition: none !important;
  }
}
</style>
