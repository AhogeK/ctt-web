<script setup lang="ts">
import type { AlertDialogActionProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { AlertDialogAction, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<AlertDialogActionProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <AlertDialogAction
    data-slot="alert-dialog-action"
    v-bind="forwardedProps"
    :class="
      cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all',
        'h-9 px-4 py-2',
        'bg-primary text-primary-foreground hover:bg-primary/90',
        'disabled:pointer-events-none disabled:opacity-50',
        '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not(\'[class*=size-]\')]:size-4',
        props.class,
      )
    "
  >
    <slot />
  </AlertDialogAction>
</template>
