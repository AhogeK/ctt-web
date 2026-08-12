<script lang="ts" setup>
import type { HTMLAttributes } from 'vue'
import { ErrorMessage } from 'vee-validate'
import { toValue } from 'vue'
import { useFormField } from './useFormField'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const { name, formMessageId } = useFormField()
</script>

<template>
  <!-- Always-rendered wrapper reserves one error line (min-h-5 = 20px, text-sm)
       to prevent layout shift when a validation message appears. -->
  <div class="min-h-5">
    <ErrorMessage
      :id="formMessageId"
      data-slot="form-message"
      as="p"
      :name="toValue(name)"
      :class="['text-destructive text-sm', props.class]"
    />
  </div>
</template>
