<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useI18n } from 'vue-i18n'
import { PanelLeft } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { useSidebar } from './utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const { toggleSidebar } = useSidebar()
const { t } = useI18n()
</script>

<template>
  <Button
    data-sidebar="trigger"
    data-slot="sidebar-trigger"
    variant="ghost"
    size="icon"
    :class="['h-7 w-7', props.class]"
    @click="toggleSidebar"
  >
    <PanelLeft />
    <span class="sr-only">{{ t('ui.toggleSidebar') }}</span>
  </Button>
</template>
