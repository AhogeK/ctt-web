<script setup lang="ts">
/**
 * Set password dialog component for OAuth users.
 *
 * Allows OAuth users (passwordHash = null) to set a password
 * so they can later sign in with email/password.
 *
 * Backend endpoint: POST /api/v1/users/me/password/set
 * Error codes:
 * - USER_015: User already has a password
 * - COMMON_003: Invalid password format
 */
import { ref, watch } from 'vue'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
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
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { StrongPasswordSchema } from '@/lib/schemas/auth.schema'
import { extractErrorCode } from '@/lib/utils/api-error'
import { useSetPassword } from '@/features/settings/composables/useSetPassword'

const props = defineProps<{
  /** Whether the dialog is open */
  open: boolean
}>()

const emit = defineEmits<{
  /** Emitted when dialog open state changes */
  'update:open': [value: boolean]
  /** Emitted when password is set successfully */
  success: []
}>()

const { mutation, SET_PASSWORD_ERROR_CODES } = useSetPassword()

/**
 * Form schema for setting password.
 * Includes new password and confirm password fields.
 */
const SetPasswordFormSchema = z
  .object({
    newPassword: StrongPasswordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type SetPasswordForm = z.infer<typeof SetPasswordFormSchema>

const form = useForm<SetPasswordForm>({
  validationSchema: toTypedSchema(SetPasswordFormSchema),
})

/** Error message to display */
const errorMessage = ref<string | null>(null)

const onSubmit = form.handleSubmit((values) => {
  errorMessage.value = null

  mutation.mutate(values.newPassword, {
    onError: (error: unknown) => {
      const code = extractErrorCode(error)
      if (code === SET_PASSWORD_ERROR_CODES.ALREADY_HAS_PASSWORD) {
        errorMessage.value = 'You already have a password set. Please use the change password option instead.'
      } else if (code === SET_PASSWORD_ERROR_CODES.INVALID_FORMAT) {
        errorMessage.value = 'Password does not meet requirements. Please check and try again.'
      } else {
        errorMessage.value = 'An unexpected error occurred. Please try again.'
      }
    },
    onSuccess: () => {
      emit('success')
    },
  })
})

function handleClose() {
  errorMessage.value = null
  form.resetForm()
  emit('update:open', false)
}

// Reset state when dialog opens
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      errorMessage.value = null
      form.resetForm()
    }
  },
)
</script>

<template>
  <Dialog :open="props.open" @update:open="handleClose">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Set Password</DialogTitle>
        <DialogDescription>
          Create a password for your account so you can sign in with your email and password.
        </DialogDescription>
      </DialogHeader>

      <form @submit="onSubmit" class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <Label
            for="new-password"
            class="text-sm font-[510] text-muted-foreground [font-feature-settings:'cv01'_'ss03']"
          >
            New Password
          </Label>
          <Input
            id="new-password"
            type="password"
            placeholder="8-64 characters, printable ASCII only"
            autocomplete="new-password"
            :class="
              cn(
                'h-10 rounded-md border border-input bg-muted text-foreground',
                'placeholder:text-muted-foreground transition-all duration-200',
                'focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/20',
                'dark:border-border dark:bg-secondary dark:text-foreground dark:placeholder:text-muted-foreground/70',
                'dark:focus:border-primary dark:focus:bg-card dark:focus:ring-primary/25',
              )
            "
            v-bind="form.defineField('newPassword')[0]"
          />
          <p v-if="form.errors.value.newPassword" class="text-sm text-destructive">
            {{ form.errors.value.newPassword }}
          </p>
        </div>

        <div class="flex flex-col gap-2">
          <Label
            for="confirm-password"
            class="text-sm font-[510] text-muted-foreground [font-feature-settings:'cv01'_'ss03']"
          >
            Confirm Password
          </Label>
          <Input
            id="confirm-password"
            type="password"
            placeholder="Re-enter your password"
            autocomplete="new-password"
            :class="
              cn(
                'h-10 rounded-md border border-input bg-muted text-foreground',
                'placeholder:text-muted-foreground transition-all duration-200',
                'focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/20',
                'dark:border-border dark:bg-secondary dark:text-foreground dark:placeholder:text-muted-foreground/70',
                'dark:focus:border-primary dark:focus:bg-card dark:focus:ring-primary/25',
              )
            "
            v-bind="form.defineField('confirmPassword')[0]"
          />
          <p v-if="form.errors.value.confirmPassword" class="text-sm text-destructive">
            {{ form.errors.value.confirmPassword }}
          </p>
        </div>

        <div v-if="errorMessage" class="rounded-md bg-destructive/10 p-3">
          <p class="text-sm text-destructive">{{ errorMessage }}</p>
        </div>

        <DialogFooter class="gap-2">
          <Button type="button" variant="ghost" :disabled="mutation.isPending.value" @click="handleClose">
            Cancel
          </Button>
          <Button
            type="submit"
            :disabled="mutation.isPending.value"
            :class="
              cn(
                'bg-primary text-primary-foreground font-[510]',
                'shadow-lg shadow-primary/15 transition-all duration-200',
                'hover:bg-primary/90 hover:shadow-primary/20',
                'disabled:opacity-70 disabled:cursor-not-allowed',
              )
            "
          >
            <svg
              v-if="mutation.isPending.value"
              class="mr-2 h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round" />
            </svg>
            {{ mutation.isPending.value ? 'Setting Password...' : 'Set Password' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
