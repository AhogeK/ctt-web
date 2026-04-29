<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div data-slot="sidebar-menu-item" data-sidebar="menu-item" :class="['group/menu-item relative', props.class]">
    <slot />
  </div>
</template>
