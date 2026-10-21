<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { acceptTerms } from '@/lib/api/auth'
import { termsContent, type TermsSection } from '@/features/auth/content'
import { useAuthStore } from '@/stores/auth'
import { usePublicConfig } from '@/composables/usePublicConfig'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    /** When true, hides Accept/Decline buttons and shows only a Close button (for registration flow) */
    readOnly?: boolean
  }>(),
  { readOnly: false },
)

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{
  accepted: []
  rejected: []
}>()

const { data: publicConfig } = usePublicConfig(open)
const currentVersion = computed(() => publicConfig.value?.termsVersion ?? '')
const isLoading = ref(false)
const authStore = useAuthStore()

// Handle dialog close without explicit decision (click outside, Escape key)
watch(open, (newValue, oldValue) => {
  if (oldValue === true && newValue === false && isLoading.value === false) {
    // Dialog was closed without accept/reject - notify parent to handle cleanup
    emit('rejected')
  }
})

function renderSectionContent(section: TermsSection) {
  const parts = section.content.split('\n\n')
  return parts.map((part, i) => ({ id: `${section.id}-p${i}`, text: part }))
}

async function handleAccept() {
  isLoading.value = true
  try {
    const response = await acceptTerms()
    // Store new tokens from terms acceptance
    authStore.setAuthFromTermsAcceptance(response)
    toast.success(t('auth.terms.accepted'))
    emit('accepted')
    open.value = false
  } catch (error) {
    toast.error(t('auth.terms.acceptFailed'))
    console.error('Terms acceptance failed:', error)
  } finally {
    isLoading.value = false
  }
}

function handleReject() {
  emit('rejected')
  open.value = false
}

function handleClose() {
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-3xl max-h-[80vh] flex flex-col">
      <DialogHeader class="shrink-0">
        <DialogTitle>{{ t('auth.terms.title') }}</DialogTitle>
        <DialogDescription>
          {{
            t('auth.terms.lastUpdated', {
              date: termsContent.lastUpdated,
              version: currentVersion || termsContent.version,
            })
          }}
        </DialogDescription>
      </DialogHeader>

      <div class="terms-scrollable overflow-y-auto pr-4 -mr-4">
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
          class="mt-6 p-4 rounded-lg bg-warning-surface dark:bg-warning-surface border border-warning-border dark:border-warning-border"
        >
          <p class="text-xs leading-relaxed text-warning dark:text-warning">
            {{ termsContent.disclaimer }}
          </p>
        </div>
      </div>

      <DialogFooter class="shrink-0">
        <template v-if="props.readOnly">
          <Button variant="outline" @click="handleClose"> {{ t('auth.common.close') }} </Button>
        </template>
        <template v-else>
          <Button variant="outline" @click="handleReject"> {{ t('auth.terms.decline') }} </Button>
          <Button :disabled="isLoading" @click="handleAccept">
            {{ isLoading ? t('auth.terms.accepting') : t('auth.terms.accept') }}
          </Button>
        </template>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.terms-scrollable {
  scrollbar-color: var(--muted-foreground) transparent;
  scrollbar-width: thin;
}
.terms-scrollable::-webkit-scrollbar {
  width: 6px;
}
.terms-scrollable::-webkit-scrollbar-track {
  background: transparent;
}
.terms-scrollable::-webkit-scrollbar-thumb {
  background-color: var(--muted-foreground);
  border-radius: 3px;
}
@media (hover: hover) {
  .terms-scrollable::-webkit-scrollbar-thumb:hover {
    background-color: var(--foreground);
  }
}
</style>
