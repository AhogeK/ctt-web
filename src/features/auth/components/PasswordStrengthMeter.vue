<script setup lang="ts">
import { computed } from 'vue'
import { Check, X } from 'lucide-vue-next'

const props = defineProps<{
  /** Password string to evaluate against 7 validation rules (min/max length, uppercase, lowercase, digit, special, allowed chars) */
  password: string
}>()

interface Rule {
  label: string
  passed: boolean
}

const rules = computed<Rule[]>(() => {
  const pwd = props.password || ''
  return [
    { label: 'At least 8 characters', passed: pwd.length >= 8 },
    { label: 'Maximum 32 characters', passed: pwd.length > 0 && pwd.length <= 32 },
    { label: 'Contains uppercase letter', passed: /[A-Z]/.test(pwd) },
    { label: 'Contains lowercase letter', passed: /[a-z]/.test(pwd) },
    { label: 'Contains a number', passed: /\d/.test(pwd) },
    { label: 'Contains special character (@$!%*?&)', passed: /[@$!%*?&]/.test(pwd) },
    {
      label: 'Only letters, numbers, and @$!%*?&',
      passed: pwd.length > 0 && /^[A-Za-z0-9@$!%*?&]*$/.test(pwd),
    },
  ]
})

const passedCount = computed(() => rules.value.filter((r) => r.passed).length)
const strengthPercentage = computed(() => (passedCount.value / rules.value.length) * 100)

/** Whether password has any content - determines neutral vs active state */
const hasPassword = computed(() => (props.password || '').length > 0)

/** Progress bar color - only active when password has content */
const strengthColor = computed(() => {
  if (!hasPassword.value) return ''
  if (passedCount.value <= 2) return 'bg-red-500'
  if (passedCount.value <= 5) return 'bg-amber-500'
  return 'bg-emerald-500'
})

/** Glow effect color - only active when password has content */
const glowColor = computed(() => {
  if (!hasPassword.value) return ''
  if (passedCount.value <= 2) return 'shadow-red-500/40'
  if (passedCount.value <= 5) return 'shadow-amber-500/40'
  return 'shadow-emerald-500/40'
})

/** Whether the progress bar should be visible */
const showProgress = computed(() => hasPassword.value && passedCount.value > 0)

/** Icon color for a rule - neutral gray when empty, active colors when has password */
function iconColor(rule: Rule): string {
  if (!hasPassword.value) return 'text-[#8a8f98] dark:text-gray-500'
  return rule.passed
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-[#8a8f98] dark:text-gray-500 opacity-50'
}

/** Text color for a rule - neutral gray when empty, active colors when has password */
function textColor(rule: Rule): string {
  if (!hasPassword.value) return 'text-[#8a8f98] dark:text-gray-500'
  return rule.passed
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-[#8a8f98] dark:text-gray-500 opacity-60'
}
</script>

<template>
  <div class="mt-3 space-y-4">
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

    <!-- Rules list: icons always rendered, only colors change between empty/active states -->
    <ul class="space-y-2">
      <li
        v-for="(rule, index) in rules"
        :key="index"
        class="flex items-center gap-2 text-[11px] leading-relaxed transition-all duration-200"
        :class="textColor(rule)"
        style="font-feature-settings: 'cv01', 'ss03'"
      >
        <Check
          v-if="rule.passed"
          class="h-3 w-3 shrink-0 transition-colors duration-200"
          :class="iconColor(rule)"
        />
        <X
          v-else
          class="h-3 w-3 shrink-0 transition-colors duration-200"
          :class="iconColor(rule)"
        />
        <span>{{ rule.label }}</span>
      </li>
    </ul>
  </div>
</template>
