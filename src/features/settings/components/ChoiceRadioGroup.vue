<script setup lang="ts">
/**
 * A labeled radio-card group shared by the Preferences sections.
 *
 * Native radios inside a fieldset: grouping, arrow-key navigation and the
 * screen-reader announcement come from the browser. The consumer owns the
 * state — `modelValue` is the selected value and `update:modelValue` fires with
 * the chosen one — so this component never writes a store, storage or the DOM.
 */
interface ChoiceOption {
  value: string
  label: string
  /** Short code for a bespoke option surface, e.g. EN / 中. */
  code?: string
  /** Specimen kind for a theme option. */
  preview?: 'system' | 'light' | 'dark'
  /** Second line explaining what the option resolves to. */
  hint?: string
}

const props = defineProps<{
  /** Fieldset legend — the accessible name of the group. */
  legend: string
  /** Radio group name, unique within the page. */
  name: string
  /** Selectable options, left to right. */
  options: ChoiceOption[]
  /** Currently selected value. */
  modelValue: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

/**
 * Two cards read as a pair; three or more share the row equally. Both class
 * strings are literals so Tailwind's scanner emits them.
 */
const columnsClass = props.options.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'

function handleChange(value: string): void {
  emit('update:modelValue', value)
}
</script>

<template>
  <fieldset class="min-w-0">
    <legend class="sr-only">{{ props.legend }}</legend>
    <div class="grid gap-2 sm:gap-3" :class="columnsClass">
      <label
        v-for="option in props.options"
        :key="option.value"
        class="group min-w-0 cursor-pointer"
        :data-state="props.modelValue === option.value ? 'checked' : 'unchecked'"
      >
        <input
          :checked="props.modelValue === option.value"
          class="peer sr-only"
          :name="props.name"
          type="radio"
          :value="option.value"
          @change="handleChange(option.value)"
        />
        <slot name="option" :option="option" :checked="props.modelValue === option.value">
          <span
            class="flex items-center justify-center rounded-md border px-3 py-2 text-sm transition-colors peer-checked:border-primary peer-checked:bg-accent peer-checked:font-medium peer-checked:text-accent-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring hover:bg-accent/50"
          >
            {{ option.label }}
          </span>
        </slot>
      </label>
    </div>
  </fieldset>
</template>
