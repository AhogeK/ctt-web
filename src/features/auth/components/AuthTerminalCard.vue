<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** Terminal command lines to display */
    lines?: string[]
    /** Terminal window title shown in the header bar */
    title?: string
    /** Theme mode for header styling */
    themeMode?: 'light' | 'dark'
  }>(),
  {
    lines: () => [
      'Total coding time: 342h 15m',
      'Top language: TypeScript (68%)',
      'Longest session: 4h 23m',
      'Active days: 89/90',
      'Current streak: 12 days',
    ],
    title: 'ctt-stats',
    themeMode: 'dark',
  },
)

const isDark = computed(() => props.themeMode === 'dark')

/** Parse a line into label and value segments.
 * Lines containing ':' are split at the last colon; everything after becomes the value span.
 */
function parseLine(line: string): {
  label: string
  value: string
  isAccent?: boolean
  isStreak?: boolean
} {
  const colonIndex = line.lastIndexOf(':')
  if (colonIndex === -1) {
    return { label: line, value: '' }
  }
  const label = line.slice(0, colonIndex + 1)
  const value = line.slice(colonIndex + 1).trim()
  // Accent: language line
  const isAccent = label.toLowerCase().includes('language')
  // Streak: current streak line
  const isStreak = label.toLowerCase().includes('streak')
  return { label, value, isAccent, isStreak }
}
</script>

<template>
  <div class="auth-card-3d auth-card-3d--terminal">
    <div class="auth-card-3d__inner auth-card-3d__terminal-inner">
      <!-- Terminal Header -->
      <div class="auth-terminal__header" :class="{ 'auth-terminal__header--light': !isDark }">
        <div class="auth-terminal__dots">
          <span class="auth-terminal__dot auth-terminal__dot--red" />
          <span class="auth-terminal__dot auth-terminal__dot--yellow" />
          <span class="auth-terminal__dot auth-terminal__dot--green" />
        </div>
        <span class="auth-terminal__title">{{ title }}</span>
      </div>

      <!-- Terminal Body -->
      <div class="auth-terminal__body">
        <div v-for="(line, index) in lines" :key="index" class="auth-terminal__line">
          <span class="auth-terminal__prompt">&gt;</span>
          <span class="auth-terminal__text">
            <template v-if="parseLine(line).value">
              {{ parseLine(line).label }}
              <span
                class="auth-terminal__value"
                :class="{
                  'auth-terminal__value--accent': parseLine(line).isAccent,
                  'auth-terminal__value--streak': parseLine(line).isStreak,
                }"
                >{{ parseLine(line).value }}</span
              >
            </template>
            <template v-else>
              {{ line }}
            </template>
          </span>
          <!-- Blinking cursor on last line -->
          <span v-if="index === lines.length - 1" class="auth-terminal__cursor" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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

.auth-terminal__header--light {
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

.auth-terminal__value {
  color: #f7f8f8;
  font-weight: 400;
}

.auth-terminal__value--accent {
  color: #7170ff;
  font-weight: 400;
}

.auth-terminal__value--streak {
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

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .auth-terminal__cursor {
    animation: none !important;
    opacity: 1 !important;
  }
}
</style>
