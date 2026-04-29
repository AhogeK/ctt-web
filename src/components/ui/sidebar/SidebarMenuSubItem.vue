<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div
    data-slot="sidebar-menu-sub-item"
    data-sidebar="menu-sub-item"
    :class="['group/menu-sub-item relative', props.class]"
  >
    <slot />
  </div>
</template>
