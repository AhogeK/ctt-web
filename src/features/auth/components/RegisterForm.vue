<script setup lang="ts">
import { shallowRef, watch } from 'vue'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm, useFieldValue } from 'vee-validate'
import { RegisterFormSchema, type RegisterRequest } from '@/lib/schemas/auth.schema'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import PasswordStrengthMeter from './PasswordStrengthMeter.vue'
import { Eye, EyeOff } from 'lucide-vue-next'

const props = defineProps<{
  /** Server-side field errors mapped to field names */
  serverErrors?: Record<string, string>
}>()

const emit = defineEmits<{
  /** Emitted when form validation passes with user registration data */
  submit: [data: RegisterRequest]
}>()

const form = useForm({
  validationSchema: toTypedSchema(RegisterFormSchema),
  validateOnInput: true,
})

const showPassword = shallowRef(false)
const showConfirmPassword = shallowRef(false)

const passwordValue = useFieldValue<string>('password')

// Valid field names for server errors
const VALID_FIELDS = ['email', 'displayName', 'password', 'confirmPassword'] as const

// Apply server errors to form fields when they arrive
watch(
  () => props.serverErrors,
  (errors) => {
    if (!errors) return
    for (const [field, message] of Object.entries(errors)) {
      if (VALID_FIELDS.includes(field as (typeof VALID_FIELDS)[number])) {
        form.setFieldError(field as (typeof VALID_FIELDS)[number], message)
      }
    }
  },
  { immediate: true },
)

const onSubmit = form.handleSubmit((values) => {
  emit('submit', {
    email: values.email,
    displayName: values.displayName,
    password: values.password,
  })
})
</script>

<template>
  <form @submit="onSubmit" class="flex flex-col gap-3 pt-6">
    <FormField v-slot="{ componentField }" name="email">
      <FormItem>
        <FormLabel
          class="text-sm font-[510] text-gray-600 dark:text-[#8a8f98]"
          style="font-feature-settings: 'cv01', 'ss03'"
          >Email</FormLabel
        >
        <FormControl>
          <Input
            type="email"
            placeholder="you@example.com"
            :class="
              cn(
                'h-11 rounded-md border border-[#d0d6e0] bg-[#f3f4f5] text-[#1a1a2e]',
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

    <FormField v-slot="{ componentField }" name="displayName">
      <FormItem>
        <FormLabel
          class="text-sm font-[510] text-gray-600 dark:text-[#8a8f98]"
          style="font-feature-settings: 'cv01', 'ss03'"
          >Display Name</FormLabel
        >
        <FormControl>
          <Input
            placeholder="Your name"
            :class="
              cn(
                'h-11 rounded-md border border-[#d0d6e0] bg-[#f3f4f5] text-[#1a1a2e]',
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

    <FormField v-slot="{ componentField }" name="password">
      <FormItem>
        <FormLabel
          class="text-sm font-[510] text-gray-600 dark:text-[#8a8f98]"
          style="font-feature-settings: 'cv01', 'ss03'"
          >Password</FormLabel
        >
        <FormControl>
          <div class="relative">
            <Input
              :type="showPassword ? 'text' : 'password'"
              placeholder="Create a strong password"
              :class="
                cn(
                  'h-11 rounded-md border border-[#d0d6e0] bg-[#f3f4f5] text-[#1a1a2e]',
                  'placeholder:text-[#8a8f98] transition-all duration-200',
                  'focus:border-[#5e6ad2] focus:bg-white focus:ring-2 focus:ring-[#5e6ad2]/20',
                  'dark:border-white/8 dark:bg-white/2 dark:text-[#f7f8f8] dark:placeholder:text-[#62666d]',
                  'dark:focus:border-[#5e6ad2] dark:focus:bg-white/4 dark:focus:ring-[#5e6ad2]/25',
                  'pr-10',
                )
              "
              v-bind="componentField"
            />
            <button
              type="button"
              tabindex="-1"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8a8f98] hover:text-[#5e6ad2] transition-colors"
              @click="showPassword = !showPassword"
            >
              <EyeOff v-if="!showPassword" class="h-4 w-4" />
              <Eye v-else class="h-4 w-4" />
            </button>
          </div>
        </FormControl>
        <PasswordStrengthMeter :password="passwordValue" />
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField v-slot="{ componentField }" name="confirmPassword">
      <FormItem class="mt-4">
        <FormLabel
          class="text-sm font-[510] text-gray-600 dark:text-[#8a8f98]"
          style="font-feature-settings: 'cv01', 'ss03'"
          >Confirm Password</FormLabel
        >
        <FormControl>
          <div class="relative">
            <Input
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="Repeat your password"
              :class="
                cn(
                  'h-11 rounded-md border border-[#d0d6e0] bg-[#f3f4f5] text-[#1a1a2e]',
                  'placeholder:text-[#8a8f98] transition-all duration-200',
                  'focus:border-[#5e6ad2] focus:bg-white focus:ring-2 focus:ring-[#5e6ad2]/20',
                  'dark:border-white/8 dark:bg-white/2 dark:text-[#f7f8f8] dark:placeholder:text-[#62666d]',
                  'dark:focus:border-[#5e6ad2] dark:focus:bg-white/4 dark:focus:ring-[#5e6ad2]/25',
                  'pr-10',
                )
              "
              v-bind="componentField"
            />
            <button
              type="button"
              tabindex="-1"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8a8f98] hover:text-[#5e6ad2] transition-colors"
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

    <Button
      type="submit"
      :class="
        cn(
          'group w-full h-11 mt-3 rounded-md bg-[#7b85d4] text-white font-[510] text-base',
          'shadow-lg shadow-[#7b85d4]/15 transition-all duration-200',
          'hover:bg-[#8b95e0] hover:shadow-[#8b95e0]/20 hover:scale-[1.02] active:scale-[0.98]',
        )
      "
      style="font-feature-settings: 'cv01', 'ss03'"
    >
      <span class="relative z-10">Create account</span>
    </Button>
  </form>
</template>
