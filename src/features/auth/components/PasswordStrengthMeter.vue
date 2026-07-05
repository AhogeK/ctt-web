<script setup lang="ts">
import { computed } from 'vue'
import { Check, X } from '@lucide/vue'

const props = defineProps<{
  /** Password string to evaluate against length tiers and character type rules */
  password: string
}>()

interface Rule {
  label: string
  passed: boolean
}

/** Calculate password strength score (0-7) based on length tiers and character types */
function calculateScore(pwd: string): number {
  if (!pwd) return 0

  // Length scoring (0-3 points)
  let lengthPoints = 0
  if (pwd.length >= 16) lengthPoints = 3
  else if (pwd.length >= 12) lengthPoints = 2
  else if (pwd.length >= 8) lengthPoints = 1

  // Character type scoring (0-4 points)
  let typePoints = 0
  if (/[A-Z]/.test(pwd)) typePoints++
  if (/[a-z]/.test(pwd)) typePoints++
  if (/\d/.test(pwd)) typePoints++
  if (/[^A-Za-z0-9]/.test(pwd)) typePoints++

  return lengthPoints + typePoints
}

/** Get length tier label based on password length */
function getLengthTier(pwd: string): { label: string; passed: boolean } {
  if (!pwd) return { label: '8+ characters required', passed: false }
  if (pwd.length >= 16) return { label: '16+ characters (strong)', passed: true }
  if (pwd.length >= 12) return { label: '12-15 characters (medium)', passed: true }
  if (pwd.length >= 8) return { label: '8-11 characters (basic)', passed: true }
  return { label: '8+ characters required', passed: false }
}

const rules = computed<Rule[]>(() => {
  const pwd = props.password || ''
  const lengthTier = getLengthTier(pwd)
  return [
    lengthTier,
    { label: 'Contains uppercase letter', passed: /[A-Z]/.test(pwd) },
    { label: 'Contains lowercase letter', passed: /[a-z]/.test(pwd) },
    { label: 'Contains a number', passed: /\d/.test(pwd) },
    { label: 'Contains special character', passed: /[^A-Za-z0-9]/.test(pwd) },
  ]
})

const score = computed(() => calculateScore(props.password || ''))
const strengthPercentage = computed(() => (score.value / 7) * 100)

/** Whether password has any content - determines neutral vs active state */
const hasPassword = computed(() => (props.password || '').length > 0)

/** Progress bar color - only active when password has content */
const strengthColor = computed(() => {
  if (!hasPassword.value) return ''
  if (score.value <= 2) return 'bg-red-500'
  if (score.value <= 5) return 'bg-amber-500'
  return 'bg-emerald-500'
})

/** Glow effect color - only active when password has content */
const glowColor = computed(() => {
  if (!hasPassword.value) return ''
  if (score.value <= 2) return 'shadow-red-500/40'
  if (score.value <= 5) return 'shadow-amber-500/40'
  return 'shadow-emerald-500/40'
})

/** Whether the progress bar should be visible */
const showProgress = computed(() => hasPassword.value && score.value > 0)

/** Icon color for a rule - neutral gray when empty, active colors when has password */
function iconColor(rule: Rule): string {
  if (!hasPassword.value) return 'text-[#8a8f98] dark:text-gray-500'
  return rule.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#8a8f98] dark:text-gray-500 opacity-50'
}

/** Text color for a rule - neutral gray when empty, active colors when has password */
function textColor(rule: Rule): string {
  if (!hasPassword.value) return 'text-[#8a8f98] dark:text-gray-500'
  return rule.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#8a8f98] dark:text-gray-500 opacity-60'
}
</script>

<template>
  <div class="mt-0 space-y-3">
    <!-- Progress bar: hidden when empty, shows colored bar with glow when active -->
    <div class="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/6">
      <div
        class="h-full rounded-full transition-all duration-500 ease-out"
        :class="[strengthColor, { 'shadow-[0_0_8px_2px]': true, [glowColor]: true }]"
        :style="{
          width: showProgress ? `${strengthPercentage}%` : '0%',
          opacity: showProgress ? 1 : 0,
          maxHeight: showProgress ? '100%' : '0',
        }"
      />
    </div>
    <!-- Score display: always rendered to prevent layout shift, visibility toggled via opacity -->
    <div
      class="text-[11px] text-[#8a8f98] dark:text-gray-500 transition-opacity duration-200"
      :style="{ opacity: hasPassword ? 1 : 0 }"
    >
      Strength: {{ score }}/7
    </div>

    <!-- Rules list: icons always rendered, only colors change between empty/active states -->
    <ul class="space-y-2">
      <li
        v-for="(rule, index) in rules"
        :key="index"
        class="flex items-center gap-2 text-[11px] leading-relaxed transition-all duration-200"
        :class="textColor(rule)"
        style="font-feature-settings: 'cv01', 'ss03'"
      >
        <Check v-if="rule.passed" class="h-3 w-3 shrink-0 transition-colors duration-200" :class="iconColor(rule)" />
        <X v-else class="h-3 w-3 shrink-0 transition-colors duration-200" :class="iconColor(rule)" />
        <span>{{ rule.label }}</span>
      </li>
    </ul>
  </div>
</template>
