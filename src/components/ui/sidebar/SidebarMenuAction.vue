<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { Primitive } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<
    PrimitiveProps & {
      showOnHover?: boolean
      class?: HTMLAttributes['class']
    }
  >(),
  {
    as: 'button',
  },
)
</script>

<template>
  <Primitive
    data-slot="sidebar-menu-action"
    data-sidebar="menu-action"
    :class="
      cn(
        'text-sidebar-foreground absolute top-1.5 right-1 flex aspect-square w-5 items-center',
        'justify-center rounded-md',
        'p-0',
        'outline-hidden transition-transform',
        'focus-visible:ring-2 ring-sidebar-ring',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        'peer-hover/menu-button:text-sidebar-accent-foreground',
        '[&>svg]:size-4 [&>svg]:shrink-0',
        'after:absolute after:-inset-2 md:after:hidden',
        'peer-data-[size=sm]/menu-button:top-1',
        'peer-data-[size=default]/menu-button:top-1.5',
        'peer-data-[size=lg]/menu-button:top-2.5',
        'group-data-[collapsible=icon]:hidden',
        showOnHover && 'peer-data-[active=true]/menu-button:text-sidebar-accent-foreground',
        showOnHover && 'group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100',
        showOnHover && 'data-[state=open]:opacity-100',
        showOnHover && 'md:opacity-0',
        props.class,
      )
    "
    :as="as"
    :as-child="asChild"
  >
    <slot />
  </Primitive>
</template>
