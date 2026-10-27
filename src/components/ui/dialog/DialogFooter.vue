<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useI18n } from 'vue-i18n'
import { DialogClose } from 'reka-ui'
import { Button } from '@/components/ui/button'

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    showCloseButton?: boolean
  }>(),
  {
    showCloseButton: false,
  },
)

const { t } = useI18n()
</script>

<template>
  <div data-slot="dialog-footer" :class="['flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', props.class]">
    <slot />
    <DialogClose v-if="showCloseButton" as-child>
      <Button variant="outline"> {{ t('ui.close') }} </Button>
    </DialogClose>
  </div>
</template>
