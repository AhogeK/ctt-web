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
    { label: 'Maximum 32 characters', passed: pwd.length <= 32 },
    { label: 'Contains uppercase letter', passed: /[A-Z]/.test(pwd) },
    { label: 'Contains lowercase letter', passed: /[a-z]/.test(pwd) },
    { label: 'Contains a number', passed: /[0-9]/.test(pwd) },
    { label: 'Contains special character (@$!%*?&)', passed: /[@$!%*?&]/.test(pwd) },
    { label: 'Only letters, numbers, and @$!%*?&', passed: /^[A-Za-z0-9@$!%*?&]*$/.test(pwd) },
  ]
})

const passedCount = computed(() => rules.value.filter((r) => r.passed).length)
const strengthPercentage = computed(() => (passedCount.value / rules.value.length) * 100)

const strengthColor = computed(() => {
  if (passedCount.value <= 2) return 'bg-red-500'
  if (passedCount.value <= 5) return 'bg-amber-500'
  return 'bg-emerald-500'
})

const glowColor = computed(() => {
  if (passedCount.value <= 2) return 'shadow-red-500/40'
  if (passedCount.value <= 5) return 'shadow-amber-500/40'
  return 'shadow-emerald-500/40'
})
</script>

<template>
  <div class="mt-3 space-y-2.5">
    <div class="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.06]">
      <div
        class="h-full rounded-full transition-all duration-500 ease-out"
        :class="[
          strengthColor,
          { 'shadow-[0_0_8px_2px]': passedCount > 0, [glowColor]: passedCount > 0 },
        ]"
        :style="{ width: `${strengthPercentage}%` }"
      />
    </div>

    <ul class="grid grid-cols-1 gap-y-2">
      <li
        v-for="(rule, index) in rules"
        :key="index"
        class="flex items-center gap-2 text-sm transition-all duration-200"
        :class="
          rule.passed
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-gray-400 dark:text-gray-500 opacity-60'
        "
        style="font-feature-settings: 'cv01', 'ss03'"
      >
        <Check v-if="rule.passed" class="h-3 w-3 shrink-0 animate-[fade-in_0.2s_ease-out]" />
        <X v-else class="h-3 w-3 shrink-0 opacity-50" />
        <span class="leading-none">{{ rule.label }}</span>
      </li>
    </ul>
  </div>
</template>
