<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { termsContent, type TermsSection } from '@/features/auth/content'

const open = defineModel<boolean>('open', { default: false })

function renderSectionContent(section: TermsSection) {
  const parts = section.content.split('\n\n')
  return parts.map((part, i) => ({ id: `${section.id}-p${i}`, text: part }))
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-3xl max-h-[80vh] flex flex-col">
      <DialogHeader class="flex-shrink-0">
        <DialogTitle>Terms of Service</DialogTitle>
        <DialogDescription>
          Last updated: {{ termsContent.lastUpdated }} &middot; Version {{ termsContent.version }}
        </DialogDescription>
      </DialogHeader>

      <div class="overflow-y-auto pr-4 -mr-4">
        <div v-for="section in termsContent.sections" :key="section.id" class="mb-6 last:mb-0">
          <h3 class="text-lg font-semibold mb-2 text-foreground">
            {{ section.title }}
          </h3>

          <div class="space-y-2">
            <p
              v-for="para in renderSectionContent(section)"
              :key="para.id"
              class="text-sm leading-relaxed text-muted-foreground"
            >
              {{ para.text }}
            </p>
          </div>

          <div v-if="section.subsections" class="mt-4 space-y-4">
            <div v-for="sub in section.subsections" :key="sub.id" class="ml-4 border-l-2 border-border pl-4">
              <h4 class="text-base font-semibold mb-2 text-foreground">
                {{ sub.title }}
              </h4>
              <div class="space-y-2">
                <p
                  v-for="para in renderSectionContent(sub)"
                  :key="para.id"
                  class="text-sm leading-relaxed text-muted-foreground"
                >
                  {{ para.text }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          class="mt-6 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
        >
          <p class="text-xs leading-relaxed text-yellow-800 dark:text-yellow-200">
            {{ termsContent.disclaimer }}
          </p>
        </div>
      </div>

      <DialogFooter class="flex-shrink-0">
        <Button variant="outline" @click="open = false"> Close </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
