<script setup lang="ts">
/**
 * Set/Change password dialog component.
 *
 * Dual-mode dialog:
 * - Set mode (hasPassword = false): OAuth users set their first password.
 *   Endpoint: POST /api/v1/users/me/password/set
 * - Change mode (hasPassword = true): Users change an existing password.
 *   Endpoint: POST /api/v1/users/me/password/change
 *
 * Error codes:
 * - USER_015: User already has a password (set mode only)
 * - USER_014: Incorrect current password (change mode only)
 * - PASSWORD_SAME_AS_OLD: New password matches current (change mode only)
 * - COMMON_003: Invalid password format
 */
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { Eye, EyeOff } from '@lucide/vue'
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
import { StrongPasswordSchema } from '@/lib/schemas/auth.schema'
import { extractErrorCode } from '@/lib/utils/api-error'
import { useSetPassword } from '@/features/settings/composables/useSetPassword'
import PasswordStrengthMeter from '@/features/auth/components/PasswordStrengthMeter.vue'

const props = defineProps<{
  /** Whether the dialog is open */
  open: boolean
  /** Whether the user already has a password (determines set vs change mode) */
  hasPassword?: boolean
}>()

const emit = defineEmits<{
  /** Emitted when dialog open state changes */
  'update:open': [value: boolean]
  /** Emitted when password is set/changed successfully */
  success: []
}>()

const { t } = useI18n()
const { mutation, changePasswordMutation, SET_PASSWORD_ERROR_CODES } = useSetPassword()

/** Dialog mode: 'set' for first password, 'change' for existing password */
const mode = computed<'set' | 'change'>(() => (props.hasPassword ? 'change' : 'set'))

/**
 * Form values type — currentPassword is always present in the type
 * but only required/rendered in change mode.
 */
interface PasswordFormValues {
  newPassword: string
  confirmPassword: string
  currentPassword?: string
}

/**
 * Form schema — conditionally includes currentPassword field.
 * Reactive: vee-validate's validationSchema accepts a computed, so the
 * schema follows the hasPassword prop even after the dialog has mounted
 * (e.g. first visit Set → profile refresh flips hasPassword → next open
 * must validate the current-password field).
 */
const SetPasswordFormSchema = computed(() =>
  z
    .object({
      newPassword: StrongPasswordSchema,
      confirmPassword: z.string().min(1, { error: () => t('settings.password.confirmRequired') }),
      ...(props.hasPassword
        ? {
            currentPassword: z.string().min(1, { error: () => t('settings.password.currentRequired') }),
          }
        : {}),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      error: () => t('settings.password.mismatch'),
      path: ['confirmPassword'],
    }),
)

const form = useForm<PasswordFormValues>({
  // Pass the computed itself: vee-validate accepts MaybeRef schemas and
  // re-validates when it changes (schema follows the hasPassword prop).
  validationSchema: computed(() => toTypedSchema(SetPasswordFormSchema.value)),
})

/** Password visibility toggles — one per password field, mirroring Login/Register forms */
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const onSubmit = form.handleSubmit((values) => {
  if (mode.value === 'change') {
    changePasswordMutation.mutate(
      { currentPassword: values.currentPassword ?? '', newPassword: values.newPassword },
      {
        onError: (error: unknown) => {
          const code = extractErrorCode(error)
          // Server-side business errors are mapped onto the matching field so
          // they render in the same FormMessage slot as validation errors —
          // no separate error banner (avoids layout jump + inconsistent style).
          if (code === 'USER_014') {
            form.setFieldError('currentPassword', t('settings.password.currentIncorrect'))
          } else if (code === 'PASSWORD_SAME_AS_OLD') {
            form.setFieldError('newPassword', t('settings.password.sameAsOld'))
          } else if (code === SET_PASSWORD_ERROR_CODES.INVALID_FORMAT) {
            form.setFieldError('newPassword', t('settings.password.requirements'))
          }
        },
        onSuccess: () => {
          emit('success')
        },
      },
    )
  } else {
    mutation.mutate(values.newPassword, {
      onError: (error: unknown) => {
        const code = extractErrorCode(error)
        if (code === SET_PASSWORD_ERROR_CODES.ALREADY_HAS_PASSWORD) {
          form.setFieldError('newPassword', t('settings.password.alreadySet'))
        } else if (code === SET_PASSWORD_ERROR_CODES.INVALID_FORMAT) {
          form.setFieldError('newPassword', t('settings.password.requirements'))
        }
      },
      onSuccess: () => {
        emit('success')
      },
    })
  }
})

function handleClose() {
  form.resetForm()
  emit('update:open', false)
}

// Reset state when dialog opens
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      form.resetForm()
    }
  },
)
</script>

<template>
  <Dialog :open="props.open" @update:open="handleClose">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{
          mode === 'change' ? t('settings.password.changeTitle') : t('settings.password.setTitle')
        }}</DialogTitle>
        <DialogDescription>
          <template v-if="mode === 'change'">
            {{ t('settings.password.changeDescription') }}
          </template>
          <template v-else>
            {{ t('settings.password.setDescription') }}
          </template>
        </DialogDescription>
      </DialogHeader>

      <form @submit="onSubmit" class="flex flex-col gap-4">
        <!-- Current Password (change mode only) -->
        <FormField v-if="mode === 'change'" v-slot="{ componentField }" name="currentPassword">
          <FormItem>
            <FormLabel class="text-sm font-emphasis text-muted-foreground [font-feature-settings:'cv01'_'ss03']">
              {{ t('settings.password.currentPassword') }}
            </FormLabel>
            <FormControl>
              <div class="relative">
                <Input
                  id="current-password"
                  :type="showCurrentPassword ? 'text' : 'password'"
                  :placeholder="t('settings.password.currentPlaceholder')"
                  autocomplete="current-password"
                  :class="
                    cn(
                      'h-10 rounded-md border border-input bg-muted text-foreground',
                      'placeholder:text-muted-foreground transition-[color,box-shadow] duration-200',
                      'focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/20',
                      'dark:border-border dark:bg-secondary dark:text-foreground dark:placeholder:text-muted-foreground/70',
                      'dark:focus:border-primary dark:focus:bg-card dark:focus:ring-primary/25',
                      'pr-10',
                    )
                  "
                  v-bind="componentField"
                />
                <button
                  type="button"
                  tabindex="-1"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                  :aria-label="
                    showCurrentPassword ? t('settings.password.hideCurrent') : t('settings.password.showCurrent')
                  "
                  @click="showCurrentPassword = !showCurrentPassword"
                >
                  <EyeOff v-if="!showCurrentPassword" class="h-4 w-4" />
                  <Eye v-else class="h-4 w-4" />
                </button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="newPassword">
          <FormItem>
            <FormLabel class="text-sm font-emphasis text-muted-foreground [font-feature-settings:'cv01'_'ss03']">
              {{ t('settings.password.newPassword') }}
            </FormLabel>
            <FormControl>
              <div class="space-y-2">
                <div class="relative">
                  <Input
                    id="new-password"
                    :type="showNewPassword ? 'text' : 'password'"
                    :placeholder="t('settings.password.newPlaceholder')"
                    autocomplete="new-password"
                    :class="
                      cn(
                        'h-10 rounded-md border border-input bg-muted text-foreground',
                        'placeholder:text-muted-foreground transition-[color,box-shadow] duration-200',
                        'focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/20',
                        'dark:border-border dark:bg-secondary dark:text-foreground dark:placeholder:text-muted-foreground/70',
                        'dark:focus:border-primary dark:focus:bg-card dark:focus:ring-primary/25',
                        'pr-10',
                      )
                    "
                    v-bind="componentField"
                  />
                  <button
                    type="button"
                    tabindex="-1"
                    class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                    :aria-label="showNewPassword ? t('settings.password.hideNew') : t('settings.password.showNew')"
                    @click="showNewPassword = !showNewPassword"
                  >
                    <EyeOff v-if="!showNewPassword" class="h-4 w-4" />
                    <Eye v-else class="h-4 w-4" />
                  </button>
                </div>
                <PasswordStrengthMeter :password="form.values.newPassword ?? ''" />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="confirmPassword">
          <FormItem>
            <FormLabel class="text-sm font-emphasis text-muted-foreground [font-feature-settings:'cv01'_'ss03']">
              {{ t('settings.password.confirmPassword') }}
            </FormLabel>
            <FormControl>
              <div class="relative">
                <Input
                  id="confirm-password"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  :placeholder="t('settings.password.confirmPlaceholder')"
                  autocomplete="new-password"
                  :class="
                    cn(
                      'h-10 rounded-md border border-input bg-muted text-foreground',
                      'placeholder:text-muted-foreground transition-[color,box-shadow] duration-200',
                      'focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/20',
                      'dark:border-border dark:bg-secondary dark:text-foreground dark:placeholder:text-muted-foreground/70',
                      'dark:focus:border-primary dark:focus:bg-card dark:focus:ring-primary/25',
                      'pr-10',
                    )
                  "
                  v-bind="componentField"
                />
                <button
                  type="button"
                  tabindex="-1"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                  :aria-label="
                    showConfirmPassword
                      ? t('settings.password.hideConfirmation')
                      : t('settings.password.showConfirmation')
                  "
                  @click="showConfirmPassword = !showConfirmPassword"
                >
                  <EyeOff v-if="!showConfirmPassword" class="h-4 w-4" />
                  <Eye v-else class="h-4 w-4" />
                </button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <DialogFooter class="gap-2">
          <Button
            type="button"
            variant="ghost"
            :disabled="mutation.isPending.value || changePasswordMutation.isPending.value"
            @click="handleClose"
          >
            {{ t('settings.common.cancel') }}
          </Button>
          <Button
            type="submit"
            :disabled="mutation.isPending.value || changePasswordMutation.isPending.value"
            :class="
              cn(
                'bg-primary text-primary-foreground font-emphasis',
                'shadow-lg shadow-primary/15 transition-[box-shadow,transform] duration-200',
                'hover:bg-primary/90 hover:shadow-primary/20',
                'disabled:opacity-70 disabled:cursor-not-allowed',
              )
            "
          >
            <svg
              v-if="mutation.isPending.value || changePasswordMutation.isPending.value"
              class="mr-2 h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round" />
            </svg>
            <template v-if="mutation.isPending.value">{{ t('settings.password.setting') }}</template>
            <template v-else-if="changePasswordMutation.isPending.value">{{
              t('settings.password.changing')
            }}</template>
            <template v-else>{{
              mode === 'change' ? t('settings.password.changeTitle') : t('settings.password.setTitle')
            }}</template>
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
