<script setup lang="ts">
/**
 * Email change dialog component.
 *
 * Shows a dialog with email input and optional password input.
 * Password input is shown only when USER_013 error is received
 * (password verification required for email change).
 */
import { ref, watch } from 'vue'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
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
import { cn } from '@/lib/utils'
import { extractErrorCode } from '@/lib/utils/api-error'
import { useEmailChange } from '@/features/settings/composables/useEmailChange'
import { EmailChangeSchema, type EmailChangeForm } from '@/lib/schemas/email-change.schema'

const props = defineProps<{
  /** Whether the dialog is open */
  open: boolean
  /** Current user email (for display) */
  currentEmail?: string
}>()

const emit = defineEmits<{
  /** Emitted when dialog open state changes */
  'update:open': [value: boolean]
  /** Emitted when email change is successful */
  success: []
}>()

const { requestMutation } = useEmailChange()

const form = useForm<EmailChangeForm>({
  validationSchema: toTypedSchema(EmailChangeSchema),
})

/** Whether password field should be visible (shown on USER_013 error) */
const showPasswordField = ref(false)

/** Error message to display */
const errorMessage = ref<string | null>(null)

const onSubmit = form.handleSubmit((values) => {
  errorMessage.value = null

  // If password field is not shown yet, try without password first
  // The backend will return USER_013 if password is required
  if (!showPasswordField.value) {
    requestMutation.mutate(
      {
        newEmail: values.email,
        password: '', // Empty password - backend will return USER_013 if required
      },
      {
        onError: (error: unknown) => {
          const code = extractErrorCode(error)
          if (code === 'USER_013') {
            showPasswordField.value = true
            errorMessage.value = 'Password verification required. Please enter your current password.'
          }
        },
      },
    )
  } else {
    // Password field is shown, submit with password
    requestMutation.mutate({
      newEmail: values.email,
      password: values.password || '',
    })
  }
})

function handleClose() {
  showPasswordField.value = false
  errorMessage.value = null
  form.resetForm()
  emit('update:open', false)
}

// Reset state when dialog opens
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      showPasswordField.value = false
      errorMessage.value = null
    }
  },
)
</script>

<template>
  <Dialog :open="props.open" @update:open="handleClose">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Change Email</DialogTitle>
        <DialogDescription>
          Enter your new email address
          <template v-if="props.currentEmail">
            (currently: <strong>{{ props.currentEmail }}</strong
            >)
          </template>
          . A verification link will be sent to confirm the change.
        </DialogDescription>
      </DialogHeader>

      <form @submit="onSubmit" class="flex flex-col gap-4">
        <FormField v-slot="{ componentField }" name="email">
          <FormItem>
            <FormLabel
              class="text-sm font-[510] text-gray-600 [font-feature-settings:'cv01'_'ss03'] dark:text-[#8a8f98]"
            >
              New Email
            </FormLabel>
            <FormControl>
              <Input
                id="new-email"
                type="email"
                placeholder="you@example.com"
                autocomplete="email"
                :class="
                  cn(
                    'h-10 rounded-md border border-[#d0d6e0] bg-[#f3f4f5] text-[#1a1a2e]',
                    'placeholder:text-[#8a8f98] transition-all duration-200',
                    'focus:border-[#5e6ad2] focus:bg-white focus:ring-2 focus:ring-[#5e6ad2]/20',
                    'dark:border-white/8 dark:bg-white/2 dark:text-[#f7f8f8] dark:placeholder:text-[#62666d]',
                    'dark:focus:border-[#5e6ad2] dark:focus:bg-white/4 dark:focus:ring-[#5e6ad2]/25',
                  )
                "
                v-bind="componentField"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-if="showPasswordField" v-slot="{ componentField }" name="password">
          <FormItem>
            <FormLabel
              class="text-sm font-[510] text-gray-600 [font-feature-settings:'cv01'_'ss03'] dark:text-[#8a8f98]"
            >
              Current Password
            </FormLabel>
            <FormControl>
              <Input
                id="current-password"
                type="password"
                placeholder="Enter your current password"
                autocomplete="current-password"
                :class="
                  cn(
                    'h-10 rounded-md border border-[#d0d6e0] bg-[#f3f4f5] text-[#1a1a2e]',
                    'placeholder:text-[#8a8f98] transition-all duration-200',
                    'focus:border-[#5e6ad2] focus:bg-white focus:ring-2 focus:ring-[#5e6ad2]/20',
                    'dark:border-white/8 dark:bg-white/2 dark:text-[#f7f8f8] dark:placeholder:text-[#62666d]',
                    'dark:focus:border-[#5e6ad2] dark:focus:bg-white/4 dark:focus:ring-[#5e6ad2]/25',
                  )
                "
                v-bind="componentField"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <div v-if="errorMessage" class="rounded-md bg-destructive/10 p-3">
          <p class="text-sm text-destructive">{{ errorMessage }}</p>
        </div>

        <DialogFooter class="gap-2">
          <Button type="button" variant="ghost" :disabled="requestMutation.isPending.value" @click="handleClose">
            Cancel
          </Button>
          <Button
            type="submit"
            :disabled="requestMutation.isPending.value"
            :class="
              cn(
                'bg-[#7b85d4] text-white font-[510]',
                'shadow-lg shadow-[#7b85d4]/15 transition-all duration-200',
                'hover:bg-[#8b95e0] hover:shadow-[#8b95e0]/20',
                'disabled:opacity-70 disabled:cursor-not-allowed',
              )
            "
          >
            <svg
              v-if="requestMutation.isPending.value"
              class="mr-2 h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round" />
            </svg>
            {{ requestMutation.isPending.value ? 'Sending...' : 'Change Email' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
