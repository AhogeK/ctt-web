<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMutation } from '@tanstack/vue-query'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { useIntervalFn } from '@vueuse/core'
import { ShieldCheck } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { RouteNames } from '@/router/route-names'
import { redirectQueryOf, resolvePostAuthTarget } from '@/router/post-auth-redirect'
import { useAuthStore } from '@/stores/auth'
import { extractErrorCode, isApiError, mapApiErrorCode } from '@/lib/utils/api-error'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

/** Lazy message: the copy must follow a language switch instead of freezing at setup time. */
const TwoFactorFormSchema = z.object({
  code: z
    // The base type carries the message as well: an untouched field is `undefined`, which fails
    // here before `.min()` runs and would otherwise show Zod's own wording.
    .string({ error: () => t('auth.twoFactor.codeRequired') })
    .trim()
    .min(1, { error: () => t('auth.twoFactor.codeRequired') }),
})

const form = useForm({
  validationSchema: toTypedSchema(TwoFactorFormSchema),
})

const challenge = computed(() => authStore.pendingTwoFactor)

/** Where the sign-in was headed before it asked for a second step. */
const redirectQuery = computed(() => redirectQueryOf(route.query))

const startedAt = Date.now()
const deadline = computed(() => startedAt + (challenge.value?.expiresIn ?? 0) * 1000)
const now = ref(Date.now())
useIntervalFn(() => {
  now.value = Date.now()
}, 1000)
const remainingSeconds = computed(() => Math.max(0, Math.ceil((deadline.value - now.value) / 1000)))
const remainingLabel = computed(() => {
  const minutes = Math.floor(remainingSeconds.value / 60)
  const seconds = remainingSeconds.value % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
})
const expired = computed(() => remainingSeconds.value === 0)

const mutation = useMutation({
  mutationFn: (code: string) => authStore.completeTwoFactorLogin(code),
  onSuccess: () => {
    router.replace(resolvePostAuthTarget(router, route.query.redirect) ?? { name: RouteNames.DASHBOARD })
  },
  onError: (error: unknown) => {
    const statusCode = isApiError(error) ? error.statusCode : undefined
    const errorCode = extractErrorCode(error)

    // The challenge itself is gone (expired or already redeemed) or the server has locked the
    // step out: no code can fix either, so the only honest move is back to the password form.
    if (errorCode === 'AUTH_026' || statusCode === 429) {
      authStore.clearTwoFactorChallenge()
      toast.error(errorCode === 'AUTH_026' ? t('auth.twoFactor.expired') : t('auth.twoFactor.rateLimited'))
      void router.replace({ name: RouteNames.LOGIN, query: redirectQuery.value })
      return
    }

    // AUTH_027 covers a wrong, already-spent or replayed code: the challenge is still good.
    form.setFieldError(
      'code',
      errorCode === 'AUTH_027'
        ? t('auth.twoFactor.invalidCode')
        : errorCode
          ? mapApiErrorCode(errorCode)
          : t('auth.twoFactor.invalidCode'),
    )
  },
})

const onSubmit = form.handleSubmit((values) => {
  mutation.mutate(values.code)
})

const isSubmitting = computed(() => mutation.isPending.value)

onMounted(() => {
  // The challenge lives in memory only, so a reload always lands here without one.
  if (!challenge.value) void router.replace({ name: RouteNames.LOGIN, query: redirectQuery.value })
})
</script>

<template>
  <div class="mx-auto w-full max-w-sm space-y-10">
    <!-- Header -->
    <div class="space-y-4">
      <div class="flex items-center gap-2.5 lg:hidden">
        <div
          class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shadow-md shadow-primary/20"
        >
          <svg
            class="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <span class="text-lg font-emphasis text-foreground dark:text-foreground">CTT</span>
      </div>
      <div
        :class="
          cn(
            'flex h-12 w-12 items-center justify-center rounded-xl',
            'bg-primary/10 text-primary dark:bg-primary/15 dark:text-accent',
          )
        "
      >
        <ShieldCheck class="h-6 w-6" aria-hidden="true" />
      </div>
      <h1
        class="text-3xl font-emphasis text-foreground dark:text-foreground"
        style="font-feature-settings: 'cv01', 'ss03'; letter-spacing: -0.704px"
      >
        {{ t('auth.twoFactor.title') }}
      </h1>
      <p class="text-base text-muted-foreground dark:text-muted-foreground">
        {{ t('auth.twoFactor.subtitle') }}
      </p>
    </div>

    <form v-if="challenge" @submit="onSubmit" class="flex flex-col gap-3 pt-4">
      <FormField v-slot="{ componentField }" name="code">
        <FormItem>
          <FormLabel class="text-sm font-emphasis text-foreground/80 dark:text-muted-foreground">{{
            t('auth.twoFactor.codeLabel')
          }}</FormLabel>
          <FormControl>
            <Input
              type="text"
              autocomplete="one-time-code"
              autocapitalize="characters"
              spellcheck="false"
              :placeholder="t('auth.twoFactor.codePlaceholder')"
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

      <p
        :class="cn('text-sm', expired ? 'text-destructive dark:text-destructive' : 'text-muted-foreground')"
        data-testid="two-factor-countdown"
      >
        {{ expired ? t('auth.twoFactor.expired') : t('auth.twoFactor.expiresIn', { time: remainingLabel }) }}
      </p>

      <Button
        type="submit"
        :disabled="isSubmitting || expired"
        :class="
          cn(
            'mt-2 h-11 w-full rounded-md font-emphasis',
            'bg-primary text-white hover:bg-primary/90',
            'dark:bg-primary dark:hover:bg-primary/80',
          )
        "
      >
        {{ isSubmitting ? t('auth.twoFactor.verifying') : t('auth.twoFactor.submit') }}
      </Button>
    </form>

    <div class="text-center">
      <RouterLink
        :to="{ name: RouteNames.LOGIN, query: redirectQuery }"
        class="text-sm font-emphasis text-primary underline-offset-4 hover:text-accent hover:underline dark:text-accent dark:hover:text-accent-hover"
      >
        {{ t('auth.twoFactor.backToSignIn') }}
      </RouterLink>
    </div>
  </div>
</template>
