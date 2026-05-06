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
          class="text-sm font-[510] text-gray-600 dark:text-[#8a8f98]"
          style="font-feature-settings: 'cv01', 'ss03'"
          >New Password</FormLabel
        >
        <FormControl>
          <div class="space-y-2">
            <Input
              type="password"
              placeholder="Enter your new password"
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
            <PasswordStrengthMeter :password="form.values.newPassword as string" />
          </div>
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField v-slot="{ componentField }" name="confirmPassword">
      <FormItem>
        <FormLabel
          class="text-sm font-[510] text-gray-600 dark:text-[#8a8f98]"
          style="font-feature-settings: 'cv01', 'ss03'"
          >Confirm Password</FormLabel
        >
        <FormControl>
          <Input
            type="password"
            placeholder="Confirm your new password"
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

    <Button
      type="submit"
      :disabled="loading"
      :class="
        cn(
          'group w-full h-10 mt-3 rounded-md bg-[#7b85d4] text-white font-[510] text-base',
          'shadow-lg shadow-[#7b85d4]/15 transition-all duration-200',
          'hover:bg-[#8b95e0] hover:shadow-[#8b95e0]/20 hover:scale-[1.02] active:scale-[0.98]',
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
