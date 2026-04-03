<script setup lang="ts">
import type { Component } from 'vue'
import type { SidebarMenuButtonProps } from './SidebarMenuButtonChild.vue'
import { reactiveOmit } from '@vueuse/core'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import SidebarMenuButtonChild from './SidebarMenuButtonChild.vue'
import { useSidebar } from './utils'
import { ref, computed } from 'vue'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<
    SidebarMenuButtonProps & {
      tooltip?: string | Component
    }
  >(),
  {
    as: 'button',
    variant: 'default',
    size: 'default',
  },
)

const { isMobile, state } = useSidebar()

const delegatedProps = reactiveOmit(props, 'tooltip')

const triggerRef = ref<HTMLElement | null>(null)
const collisionBoundaryRef = computed(() => triggerRef.value)
</script>

<template>
  <SidebarMenuButtonChild v-if="!tooltip" v-bind="{ ...delegatedProps, ...$attrs }">
    <slot />
  </SidebarMenuButtonChild>

  <Tooltip v-else>
    <TooltipTrigger as-child>
      <SidebarMenuButtonChild ref="triggerRef" v-bind="{ ...delegatedProps, ...$attrs }">
        <slot />
      </SidebarMenuButtonChild>
    </TooltipTrigger>
    <TooltipContent
      side="right"
      align="center"
      :hidden="state !== 'collapsed' || isMobile"
      :collision-boundary="collisionBoundaryRef"
      :collision-padding="8"
      :position-strategy="'absolute'"
      :avoid-collisions="true"
      :sticky="'partial'"
      :update-position-strategy="'always'"
      :hide-when-detached="true"
      :arrow-padding="4"
      :align-offset="0"
    >
      <template v-if="typeof tooltip === 'string'">
        {{ tooltip }}
      </template>
      <component :is="tooltip" v-else />
    </TooltipContent>
  </Tooltip>
</template>
