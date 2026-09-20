<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { ResetPasswordFormSchema } from '@/lib/schemas/auth.schema'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import PasswordStrengthMeter from './PasswordStrengthMeter.vue'

const emit = defineEmits<{
  /** Emitted when form validation passes with the new password */
  submit: [data: { newPassword: string }]
}>()

const props = defineProps<{
  /** Whether the form is currently submitting (disables button + shows loading) */
  loading?: boolean
}>()

const form = useForm({
  validationSchema: toTypedSchema(ResetPasswordFormSchema),
})

const onSubmit = form.handleSubmit((values) => {
  emit('submit', { newPassword: values.newPassword as string })
})
</script>

<template>
  <form @submit="onSubmit" class="flex flex-col gap-3 pt-4">
    <FormField v-slot="{ componentField }" name="newPassword">
      <FormItem>
        <FormLabel
          class="text-sm font-emphasis text-foreground/80 dark:text-muted-foreground"
          style="font-feature-settings: 'cv01', 'ss03'"
          >New Password</FormLabel
        >
        <FormControl>
          <div class="space-y-2">
            <Input
              type="password"
              placeholder="Enter your new password"
              autocomplete="new-password"
              :class="
                cn(
                  'h-10 rounded-md border border-border bg-secondary text-foreground',
                  'placeholder:text-muted-foreground transition-[color,box-shadow] duration-200',
                  'focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20',
                  'dark:border-white/8 dark:bg-white/2 dark:text-foreground dark:placeholder:text-muted-foreground',
                  'dark:focus:border-primary dark:focus:bg-white/4 dark:focus:ring-primary/25',
                )
              "
              v-bind="componentField"
            />
            <PasswordStrengthMeter :password="form.values.newPassword ?? ''" />
          </div>
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField v-slot="{ componentField }" name="confirmPassword">
      <FormItem>
        <FormLabel
          class="text-sm font-emphasis text-foreground/80 dark:text-muted-foreground"
          style="font-feature-settings: 'cv01', 'ss03'"
          >Confirm Password</FormLabel
        >
        <FormControl>
          <Input
            type="password"
            placeholder="Confirm your new password"
            autocomplete="new-password"
            :class="
              cn(
                'h-10 rounded-md border border-border bg-secondary text-foreground',
                'placeholder:text-muted-foreground transition-[color,box-shadow] duration-200',
                'focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20',
                'dark:border-white/8 dark:bg-white/2 dark:text-foreground dark:placeholder:text-muted-foreground',
                'dark:focus:border-primary dark:focus:bg-white/4 dark:focus:ring-primary/25',
              )
            "
            v-bind="componentField"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <Button
      type="submit"
      :disabled="loading"
      :class="
        cn(
          'group w-full h-10 mt-3 rounded-md bg-primary text-white font-emphasis text-base',
          'shadow-lg shadow-primary/15 transition-[box-shadow,transform] duration-200',
          'hover:bg-accent-hover hover:shadow-accent-hover/20 hover:scale-[1.02] active:scale-[0.98]',
          'disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100',
        )
      "
      style="font-feature-settings: 'cv01', 'ss03'"
    >
      <svg
        v-if="loading"
        class="mr-2 h-4 w-4 animate-spin"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
        <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round" />
      </svg>
      <span class="relative z-10">{{ loading ? 'Resetting...' : 'Reset password' }}</span>
    </Button>
  </form>
</template>
