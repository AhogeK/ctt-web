<script setup lang="ts">
/**
 * Login page view with Vee-Validate + Zod form validation.
 * Handles authentication flow with redirect support for protected routes.
 */
import { ref } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { useStorage } from '@vueuse/core'
import { LoginRequestSchema } from '@/lib/schemas/auth.schema'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

// Device ID persisted in localStorage for device binding across sessions
const deviceId = useStorage('deviceId', crypto.randomUUID())

const form = useForm({
  validationSchema: toTypedSchema(LoginRequestSchema.omit({ deviceId: true })),
})

const isSubmitting = ref(false)

async function onSubmit(values: Record<string, unknown>) {
  isSubmitting.value = true
  try {
    await authStore.login({
      email: values.email as string,
      password: values.password as string,
      deviceId: deviceId.value,
    })
    // Redirect to intended destination or dashboard after successful login
    const redirectPath = (route.query.redirect as string) || '/dashboard'
    await router.replace(redirectPath)
    toast.success('Welcome back')
  } catch {
    // Error is shown as toast, form remains editable for retry
    toast.error('Login failed. Please check your credentials.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="min-h-screen bg-background flex items-center justify-center p-4">
    <Card class="w-full max-w-md">
      <CardHeader class="space-y-1 text-center">
        <CardTitle class="text-2xl font-bold">Login</CardTitle>
        <CardDescription>Sign in to your CTT account</CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit="form.handleSubmit(onSubmit)" class="space-y-4">
          <FormField v-slot="{ componentField }" name="email">
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" v-bind="componentField" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="password">
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Enter your password" v-bind="componentField" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <Button type="submit" class="w-full" :disabled="isSubmitting">
            <span v-if="isSubmitting">Signing in...</span>
            <span v-else>Sign in</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  </main>
</template>
