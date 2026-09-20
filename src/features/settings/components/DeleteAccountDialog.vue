<script setup lang="ts">
/**
 * DeleteAccountDialog — the irreversible confirmation for deleting one's own account.
 *
 * ## Why this is not a plain confirm
 *
 * The backend cannot ask a passwordless account for one: `AccountDeletionService` skips the check
 * entirely when the account has no password hash, and the only remaining credential is the session
 * itself — which the person at the keyboard already holds. A stolen session (or an unlocked,
 * unattended browser) is therefore enough to destroy the account.
 *
 * The typed email below does **not** close that hole and is not presented as if it did: it is
 * mistake prevention, the same device GitHub uses for repository deletion, and it is the only thing
 * standing between an accidental click and permanent data loss on such an account. Requiring a
 * fresh OAuth re-authentication is the real fix and belongs on the server.
 *
 * ## Dismissal
 *
 * Outside clicks and Escape are blocked, and there is no close button: an irreversible action should
 * not be one stray click away from being abandoned mid-thought, nor confidently "cancelled" by a
 * gesture that a reader may not connect to this dialog. Cancelling is an explicit button.
 *
 * ## Errors
 *
 * A wrong password is mapped onto the password field, in the same slot as validation errors, rather
 * than toasted — the reader has to correct it here, and a toast would be transient and elsewhere.
 * Anything else is toasted, since it is not something this form can fix.
 */
import { computed, ref, watch } from 'vue'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { Eye, EyeOff, TriangleAlert } from '@lucide/vue'
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
import { toast } from 'vue-sonner'
import { cn } from '@/lib/utils'
import { extractErrorCode, getErrorMessage } from '@/lib/utils/api-error'
import { PASSWORD_MISMATCH_CODE, useDeleteAccount } from '../composables/useDeleteAccount'

const props = defineProps<{
  /** Whether the dialog is open */
  open: boolean
  /** The account's email — the phrase a passwordless account has to type back */
  email: string
  /** Whether the account has a password, which decides how it is confirmed */
  hasPassword: boolean
}>()

const emit = defineEmits<{
  /** Emitted when dialog open state changes */
  'update:open': [value: boolean]
}>()

const { mutation } = useDeleteAccount()

/** Shared input treatment, matching the other password fields in this feature. */
const inputClass = cn(
  'h-10 rounded-md border border-input bg-muted text-foreground',
  'placeholder:text-muted-foreground transition-[color,box-shadow] duration-200',
  'focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/20',
  'dark:border-border dark:bg-secondary dark:text-foreground dark:placeholder:text-muted-foreground/70',
  'dark:focus:border-primary dark:focus:bg-card dark:focus:ring-primary/25',
  'pr-10',
)

interface DeleteAccountFormValues {
  password?: string
  confirmEmail?: string
}

/**
 * Reactive schema: the confirmation field follows `hasPassword`, which arrives from the profile
 * query and can flip after the dialog has mounted (an OAuth user who sets a password while this
 * component is alive must be asked for it, not for their email).
 */
const DeleteAccountFormSchema = computed(() =>
  z.object(
    props.hasPassword
      ? { password: z.string().min(1, 'Enter your password to confirm') }
      : {
          confirmEmail: z
            .string()
            .min(1, 'Type your email to confirm')
            // Compared case-insensitively and trimmed: the server normalises emails to lowercase,
            // and demanding exact capitalisation would only punish a correct answer.
            .refine((value) => value.trim().toLowerCase() === props.email.trim().toLowerCase(), {
              message: 'That does not match the email on this account',
            }),
        },
  ),
)

const form = useForm<DeleteAccountFormValues>({
  validationSchema: computed(() => toTypedSchema(DeleteAccountFormSchema.value)),
  // Start the fields as empty strings rather than leaving them undefined: an untouched field
  // would otherwise fail `z.string()` with Zod's own wording and show the reader
  // "expected string, received undefined" — an internal message on a destructive dialog.
  initialValues: { password: '', confirmEmail: '' },
})

const showPassword = ref(false)

const onSubmit = form.handleSubmit((values) => {
  mutation.mutate(props.hasPassword ? (values.password ?? '') : null, {
    onError: (error: unknown) => {
      const code = extractErrorCode(error)
      if (code === PASSWORD_MISMATCH_CODE) {
        form.setFieldError('password', 'That password is incorrect.')
        return
      }
      // `mapApiErrorCode('')` yields an empty string, so a failure that carries no server code at
      // all — timeout, offline, aborted — used to arrive as a toast with a blank description. Those
      // are exactly the failures where the reader cannot tell whether the deletion happened.
      toast.error('Could not delete your account', {
        description: getErrorMessage(error),
      })
    },
  })
})

function handleClose() {
  form.resetForm()
  emit('update:open', false)
}

// Start each attempt clean: a field error from a previous try must not greet the next one.
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) form.resetForm()
  },
)
</script>

<template>
  <!-- `role="alertdialog"` states that this interrupts and demands an answer, which is what a
       destructive confirmation is; `DialogContent` forwards attributes to the primitive. -->
  <Dialog :open="props.open" @update:open="handleClose">
    <DialogContent
      role="alertdialog"
      class="sm:max-w-md"
      :show-close-button="false"
      @pointer-down-outside.prevent
      @escape-key-down.prevent
      @interact-outside.prevent
    >
      <DialogHeader class="text-left">
        <div class="flex items-center gap-2">
          <TriangleAlert class="h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
          <DialogTitle>Delete your account?</DialogTitle>
        </div>
        <DialogDescription class="pt-1">
          This deletes your account and everything the server holds for it: sessions, statistics, achievements, devices
          and API keys.
          <span class="font-medium text-foreground">It cannot be undone.</span>
        </DialogDescription>
      </DialogHeader>

      <form class="flex flex-col gap-4" @submit="onSubmit">
        <!-- Accounts with a password confirm with it: the server verifies it and refuses the
             request otherwise. A passwordless account has nothing to verify, so it confirms by
             typing its own email instead — mistake prevention, not authentication. -->
        <FormField v-if="props.hasPassword" v-slot="{ componentField }" name="password">
          <FormItem>
            <FormLabel class="text-sm font-emphasis text-muted-foreground [font-feature-settings:'cv01'_'ss03']">
              Confirm your password
            </FormLabel>
            <FormControl>
              <div class="relative">
                <Input
                  id="delete-account-password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Enter your current password"
                  autocomplete="current-password"
                  :class="inputClass"
                  data-testid="delete-account-password"
                  v-bind="componentField"
                />
                <button
                  type="button"
                  tabindex="-1"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground transition-colors hover:text-primary"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                  @click="showPassword = !showPassword"
                >
                  <EyeOff v-if="!showPassword" class="h-4 w-4" />
                  <Eye v-else class="h-4 w-4" />
                </button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-else v-slot="{ componentField }" name="confirmEmail">
          <FormItem>
            <FormLabel class="text-sm font-emphasis text-muted-foreground [font-feature-settings:'cv01'_'ss03']">
              Type your email to confirm
            </FormLabel>
            <FormControl>
              <Input
                id="delete-account-email"
                type="email"
                autocomplete="off"
                :placeholder="props.email"
                :class="inputClass"
                data-testid="delete-account-email"
                v-bind="componentField"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <p class="text-xs text-muted-foreground">
          Your plugin keeps its own copy of your history, so registering again and syncing restores it.
        </p>

        <DialogFooter class="gap-2">
          <Button
            type="button"
            variant="ghost"
            :disabled="mutation.isPending.value"
            data-testid="delete-account-cancel"
            @click="handleClose"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="destructive"
            :disabled="mutation.isPending.value"
            data-testid="delete-account-confirm"
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
            {{ mutation.isPending.value ? 'Deleting…' : 'Delete my account' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
