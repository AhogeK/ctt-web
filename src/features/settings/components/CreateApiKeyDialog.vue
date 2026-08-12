<script setup lang="ts">
/**
 * Create API Key dialog.
 *
 * Collects name, scopes and optional expiration via a vee-validate + Zod form,
 * then calls POST /api/v1/auth/api-keys. On success emits `success` with the
 * create response so the parent can open the RawKeyDialog (raw key shown once).
 *
 * Error handling:
 * - 409 AUTH_014 (per-user limit of 20 reached) shows an inline banner and
 *   keeps the form values intact.
 * - 429 RATE_LIMIT_001 and other failures surface as a toast.
 */
import { ref, watch } from 'vue'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { toast } from 'vue-sonner'
import { AlertTriangle, Loader2, Plus } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { cn } from '@/lib/utils'
import {
  CreateApiKeyRequestSchema,
  ApiKeyScopeEnum,
  type ApiKeyScope,
  type CreateApiKeyResponse,
} from '@/lib/schemas/api-key.schema'
import { extractErrorCode, getErrorMessage, getRetryAfterSeconds } from '@/lib/utils/api-error'
import { useCreateApiKey } from '@/composables/useApiKeys'

const props = defineProps<{
  /** Whether the dialog is open */
  open: boolean
}>()

const emit = defineEmits<{
  /** Emitted when dialog open state changes */
  'update:open': [value: boolean]
  /** Emitted with the create response when a key is created successfully */
  success: [response: CreateApiKeyResponse]
}>()

const { mutation } = useCreateApiKey()

const API_KEY_LIMIT_REACHED = 'AUTH_014'

const form = useForm<{ name: string; scopes: ApiKeyScope[]; expiresAt?: string }>({
  validationSchema: toTypedSchema(CreateApiKeyRequestSchema),
  initialValues: {
    name: '',
    scopes: ['READ', 'SYNC'],
    expiresAt: undefined,
  },
})

/** Scope selection mode: preset JetBrains recommendation or manual pick */
const scopeMode = ref<'recommended' | 'custom'>('recommended')
/** Expiration input mode: preset durations or a custom date */
const expiresMode = ref<'preset' | 'custom'>('preset')
/** Currently selected preset duration in days (null when custom or never) */
const selectedPresetDays = ref<number | null>(null)
/** Custom expiration date in YYYY-MM-DD (native date input) */
const customExpiresDate = ref('')
/** Inline banner for the per-user key limit error */
const limitError = ref<string | null>(null)

const PRESET_EXPIRATION_DAYS = [
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
  { days: 365, label: '1 year' },
] as const

const ALL_SCOPES = ApiKeyScopeEnum.options

function isScopeSelected(scope: ApiKeyScope): boolean {
  return form.values.scopes.includes(scope)
}

function toggleScope(scope: ApiKeyScope, checked: boolean) {
  const current = form.values.scopes
  form.setFieldValue('scopes', checked ? [...current, scope] : current.filter((s) => s !== scope))
}

/**
 * Wraps the reka-ui checkbox update event (boolean | 'indeterminate')
 * and treats any non-true value as unchecked.
 */
function onScopeToggle(scope: ApiKeyScope, checked: unknown) {
  toggleScope(scope, checked === true)
}

function selectScopeMode(mode: 'recommended' | 'custom') {
  scopeMode.value = mode
  form.setFieldValue('scopes', ['READ', 'SYNC'])
}

function selectPresetExpiration(days: number) {
  expiresMode.value = 'preset'
  selectedPresetDays.value = days
  form.setFieldValue('expiresAt', new Date(Date.now() + days * 86_400_000).toISOString())
}

function selectNeverExpires() {
  expiresMode.value = 'preset'
  selectedPresetDays.value = null
  form.setFieldValue('expiresAt', undefined)
}

function selectCustomExpiration() {
  expiresMode.value = 'custom'
  selectedPresetDays.value = null
  // Keep the previous preset value until the user picks a date.
  if (customExpiresDate.value) {
    applyCustomExpiration()
  }
}

function applyCustomExpiration() {
  if (!customExpiresDate.value) return
  // Interpret the picked date as the end of that local day.
  form.setFieldValue('expiresAt', new Date(`${customExpiresDate.value}T23:59:59`).toISOString())
}

const onSubmit = form.handleSubmit((values) => {
  limitError.value = null
  mutation.mutate(values, {
    onSuccess: (response) => {
      emit('success', response)
    },
    onError: (error: unknown) => {
      const code = extractErrorCode(error)
      if (code === API_KEY_LIMIT_REACHED) {
        limitError.value =
          'You have reached the maximum of 20 API keys. Revoke an unused key before creating a new one.'
      } else {
        // 429 RATE_LIMIT_001: show a countdown when timing info is available
        // (HTTP Retry-After header OR a retryAfter Instant in the body), else
        // fall back to the static mapped message. The create endpoint sends
        // neither today, so most users see the static text; other endpoints
        // that add timing light up automatically. Form stays open either way.
        if (code === 'RATE_LIMIT_001') {
          const seconds = getRetryAfterSeconds(error)
          if (seconds !== null) {
            toast.error('Failed to create API key', {
              description: `Please try again in ${seconds}s.`,
            })
            return
          }
        }
        toast.error('Failed to create API key', {
          description: getErrorMessage(error),
        })
      }
    },
  })
})

function handleClose() {
  limitError.value = null
  form.resetForm()
  scopeMode.value = 'recommended'
  expiresMode.value = 'preset'
  selectedPresetDays.value = null
  customExpiresDate.value = ''
  emit('update:open', false)
}

// Reset form state every time the dialog opens.
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      limitError.value = null
      form.resetForm()
      scopeMode.value = 'recommended'
      expiresMode.value = 'preset'
      selectedPresetDays.value = null
      customExpiresDate.value = ''
      form.setFieldValue('scopes', ['READ', 'SYNC'])
    }
  },
)
</script>

<template>
  <Dialog :open="props.open" @update:open="handleClose">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Create API Key</DialogTitle>
        <DialogDescription>
          Create a key to authenticate the JetBrains plugin. The full key is shown only once.
        </DialogDescription>
      </DialogHeader>

      <form @submit="onSubmit" class="flex flex-col gap-4">
        <!-- Per-user limit banner (409 AUTH_014) -->
        <div
          v-if="limitError"
          role="alert"
          class="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3"
        >
          <AlertTriangle class="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p class="text-sm text-destructive">{{ limitError }}</p>
        </div>

        <!-- Name -->
        <FormField v-slot="{ componentField }" name="name">
          <FormItem>
            <div class="flex items-center justify-between">
              <FormLabel class="text-sm font-[510] text-muted-foreground [font-feature-settings:'cv01'_'ss03']">
                Name
              </FormLabel>
              <!-- Live counter: maxlength silently truncates pasted text, so the
                   counter makes the 100-char limit visible to the user -->
              <span
                class="text-xs tabular-nums text-muted-foreground"
                :class="{ 'text-destructive': form.values.name.length >= 100 }"
              >
                {{ form.values.name.length }}/100
              </span>
            </div>
            <FormControl>
              <Input
                id="api-key-name"
                type="text"
                maxlength="100"
                placeholder="e.g. MacBook Pro - IntelliJ IDEA"
                :class="
                  cn(
                    'h-10 rounded-md border border-input bg-muted text-foreground',
                    'placeholder:text-muted-foreground transition-all duration-200',
                    'focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/20',
                    'dark:border-border dark:bg-secondary dark:text-foreground dark:placeholder:text-muted-foreground/70',
                    'dark:focus:border-primary dark:focus:bg-card dark:focus:ring-primary/25',
                  )
                "
                v-bind="componentField"
              />
            </FormControl>
            <!-- No v-if here: FormMessage always renders its min-h wrapper so
                 the error line reserves space and the form does not shift when
                 "Name is required" appears. -->
            <FormMessage />
          </FormItem>
        </FormField>

        <!-- Scopes -->
        <div class="flex flex-col gap-2">
          <Label class="text-sm font-[510] text-muted-foreground [font-feature-settings:'cv01'_'ss03']">
            Permissions
          </Label>
          <div class="flex gap-2">
            <Button
              type="button"
              size="sm"
              :variant="scopeMode === 'recommended' ? 'default' : 'outline'"
              @click="selectScopeMode('recommended')"
            >
              JetBrains plugin (READ + SYNC)
            </Button>
            <Button
              type="button"
              size="sm"
              :variant="scopeMode === 'custom' ? 'default' : 'outline'"
              @click="selectScopeMode('custom')"
            >
              Custom
            </Button>
          </div>

          <div v-if="scopeMode === 'recommended'" class="flex flex-wrap gap-1.5">
            <span
              v-for="scope in ['READ', 'SYNC']"
              :key="scope"
              class="rounded bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
            >
              {{ scope }}
            </span>
          </div>

          <div v-else class="grid grid-cols-2 gap-2">
            <label
              v-for="scope in ALL_SCOPES"
              :key="scope"
              class="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm"
              :class="isScopeSelected(scope) ? 'border-primary/50 bg-primary/5' : 'border-input'"
            >
              <Checkbox :checked="isScopeSelected(scope)" @update:checked="onScopeToggle(scope, $event)" />
              <span>{{ scope }}</span>
            </label>
          </div>
          <p v-if="form.errors.value.scopes" class="text-sm text-destructive">
            {{ form.errors.value.scopes }}
          </p>
        </div>

        <!-- Expiration -->
        <div class="flex flex-col gap-2">
          <Label class="text-sm font-[510] text-muted-foreground [font-feature-settings:'cv01'_'ss03']">
            Expiration
          </Label>
          <div class="flex flex-wrap gap-2">
            <Button
              v-for="preset in PRESET_EXPIRATION_DAYS"
              :key="preset.days"
              type="button"
              size="sm"
              variant="outline"
              :class="
                expiresMode === 'preset' && selectedPresetDays === preset.days ? 'border-primary text-primary' : ''
              "
              @click="selectPresetExpiration(preset.days)"
            >
              {{ preset.label }}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              :class="expiresMode === 'preset' && selectedPresetDays === null ? 'border-primary text-primary' : ''"
              @click="selectNeverExpires()"
            >
              Never expires
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              :class="expiresMode === 'custom' ? 'border-primary text-primary' : ''"
              @click="selectCustomExpiration()"
            >
              Custom date
            </Button>
          </div>

          <Input
            v-if="expiresMode === 'custom'"
            id="api-key-expires"
            type="date"
            :class="
              cn(
                'h-10 w-fit rounded-md border border-input bg-muted text-foreground',
                'focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/20',
                'dark:border-border dark:bg-secondary dark:text-foreground',
              )
            "
            v-model="customExpiresDate"
            @change="applyCustomExpiration"
          />
          <p v-if="form.errors.value.expiresAt" class="text-sm text-destructive">
            {{ form.errors.value.expiresAt }}
          </p>
        </div>

        <DialogFooter class="gap-2">
          <Button type="button" variant="ghost" :disabled="mutation.isPending.value" @click="handleClose">
            Cancel
          </Button>
          <Button
            type="submit"
            :disabled="mutation.isPending.value || form.values.scopes.length === 0"
            :class="
              cn(
                'bg-primary text-primary-foreground font-[510]',
                'shadow-lg shadow-primary/15 transition-all duration-200',
                'hover:bg-primary/90 hover:shadow-primary/20',
                'disabled:opacity-70 disabled:cursor-not-allowed',
              )
            "
          >
            <Loader2 v-if="mutation.isPending.value" class="mr-2 h-4 w-4 animate-spin" />
            <Plus v-else class="mr-2 h-4 w-4" />
            {{ mutation.isPending.value ? 'Creating...' : 'Create API Key' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
