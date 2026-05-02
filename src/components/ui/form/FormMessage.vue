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
  <!-- Always-rendered wrapper reserves space for up to 2 lines to prevent layout shift -->
  <div class="min-h-8">
    <ErrorMessage
      :id="formMessageId"
      data-slot="form-message"
      as="p"
      :name="toValue(name)"
      :class="['text-destructive text-sm', props.class]"
    />
  </div>
</template>
