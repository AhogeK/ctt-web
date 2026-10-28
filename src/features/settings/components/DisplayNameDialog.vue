<script setup lang="ts">
/**
 * Display name dialog.
 *
 * The field carries the registration rule itself (`UpdateProfileRequestSchema`), so the browser
 * rejects exactly what the server would reject — including a name that is only whitespace.
 *
 * The profile the server returns, not the typed value, is what the store keeps afterwards: the
 * server trims and writes the name, and the response is the account as it now stands. The same
 * response also carries the terms version and the pending email change, so a dialog that only
 * edits the name still leaves the rest of the store current.
 */
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { useMutation } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { updateDisplayName } from '@/lib/api'
import { UpdateProfileRequestSchema, type UpdateProfileRequest } from '@/lib/schemas/user.schema'
import { extractErrorCode, mapApiErrorCode } from '@/lib/utils/api-error'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
  /** Whether the dialog is open */
  open: boolean
  /** The name the account currently has, used to prefill the field */
  currentName: string
}>()

const emit = defineEmits<{
  /** Emitted when dialog open state changes */
  'update:open': [value: boolean]
}>()

const { t } = useI18n()
const authStore = useAuthStore()

const form = useForm<UpdateProfileRequest>({
  validationSchema: toTypedSchema(UpdateProfileRequestSchema),
  // The field always holds a string: an unset field reaches the schema as `undefined`, which
  // fails on the type before the catalogue's "required" message can be produced.
  initialValues: { displayName: props.currentName },
})

/** Server-side failure text: a rejected name, a deactivated account, a missing scope. */
const errorMessage = ref<string | null>(null)

const mutation = useMutation({
  mutationFn: (displayName: string) => updateDisplayName(displayName),
  onSuccess: (profile) => {
    authStore.applyProfile(profile)
    toast.success(t('settings.displayName.saved'))
    emit('update:open', false)
  },
  onError: (error) => {
    // AUTH_001 is handled by the apiFetch interceptor, which redirects to sign-in.
    const code = extractErrorCode(error)
    if (code === 'AUTH_001') return
    errorMessage.value = code ? mapApiErrorCode(code) : t('settings.displayName.failed')
  },
})

const onSubmit = form.handleSubmit((values) => {
  errorMessage.value = null
  mutation.mutate(values.displayName)
})

function handleClose() {
  errorMessage.value = null
  emit('update:open', false)
}

// The field starts at the name on record each time the dialog opens, so a cancelled edit is
// not carried into the next attempt.
watch(
  () => props.open,
  (open) => {
    if (!open) return
    errorMessage.value = null
    form.resetForm({ values: { displayName: props.currentName } })
  },
)

const isSaving = computed(() => mutation.isPending.value)
</script>

<template>
  <Dialog :open="props.open" @update:open="handleClose">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ t('settings.displayName.title') }}</DialogTitle>
        <DialogDescription>{{ t('settings.displayName.description') }}</DialogDescription>
      </DialogHeader>

      <form class="flex flex-col gap-4" @submit="onSubmit">
        <FormField v-slot="{ componentField }" name="displayName">
          <FormItem>
            <FormLabel>{{ t('settings.displayName.label') }}</FormLabel>
            <FormControl>
              <Input
                v-bind="componentField"
                :placeholder="t('settings.displayName.placeholder')"
                autocomplete="nickname"
                data-testid="display-name-input"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <div v-if="errorMessage" class="rounded-md bg-destructive/10 p-3" role="alert">
          <p class="text-sm text-destructive">{{ errorMessage }}</p>
        </div>

        <DialogFooter class="gap-2">
          <Button type="button" variant="ghost" :disabled="isSaving" @click="handleClose">
            {{ t('settings.common.cancel') }}
          </Button>
          <Button type="submit" :disabled="isSaving" data-testid="display-name-save">
            {{ isSaving ? t('settings.displayName.saving') : t('settings.common.save') }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
