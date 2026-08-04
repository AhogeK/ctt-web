import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import { ref, defineComponent, type Ref } from 'vue'
import ApiKeysView from '../ApiKeysView.vue'
import type { ApiKey } from '@/lib/schemas/api-key.schema'

// ==========================================
// Hoisted Mock Variables
// ==========================================

const mockMutate = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const pendingState = vi.hoisted(() => ({ value: false }))

// Real vue refs so template auto-unwrap works correctly
const queryData: Ref<ApiKey[] | undefined> = ref(undefined)
const queryIsPending: Ref<boolean> = ref(false)
const queryIsError: Ref<boolean> = ref(false)
const mockRefetch = vi.hoisted(() => vi.fn<() => Promise<unknown>>())

// ==========================================
// Mocks
// ==========================================

vi.mock('@/composables/useApiKeys', () => ({
  useApiKeys: vi.fn<() => unknown>(() => ({
    data: queryData,
    isPending: queryIsPending,
    isError: queryIsError,
    error: ref(null),
    refetch: mockRefetch,
  })),
  useRevokeApiKey: vi.fn<() => unknown>(() => ({
    mutation: {
      mutate: mockMutate,
      isPending: pendingState,
      isError: ref(false),
      error: ref(null),
    },
  })),
}))

vi.mock('@lucide/vue', () => ({
  KeyRound: { template: '<svg data-testid="icon-key-round" />' },
  Plus: { template: '<svg data-testid="icon-plus" />' },
  AlertTriangle: { template: '<svg data-testid="icon-alert" />' },
  Loader2: { template: '<svg data-testid="icon-loader" />' },
}))

vi.mock('@/components/ui/button', () => ({
  Button: {
    props: ['variant', 'size', 'disabled'],
    template: '<button :disabled="disabled" :data-variant="variant" :data-size="size"><slot /></button>',
  },
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: {
    props: ['variant'],
    template: '<span :data-variant="variant"><slot /></span>',
  },
}))

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: { props: ['class'], template: '<div :class="class" data-testid="skeleton" />' },
}))

vi.mock('vue-sonner', () => ({
  toast: { success: vi.fn<() => void>(), error: vi.fn<() => void>() },
}))

vi.mock('@/lib/utils', () => ({
  cn: (...inputs: unknown[]) => inputs.filter(Boolean).join(' '),
}))

vi.mock('@/features/settings/components/CreateApiKeyDialog.vue', () => ({
  default: {
    props: ['open'],
    emits: ['update:open', 'success'],
    template: '<div data-testid="create-dialog" />',
  },
}))

vi.mock('@/features/settings/components/RawKeyDialog.vue', () => ({
  default: {
    props: ['open', 'rawKey'],
    emits: ['update:open'],
    template: '<div data-testid="raw-key-dialog" />',
  },
}))

// Named stub so tests can use findComponent({ name }) to emit update:open
// for closing the dialog (exercises the stale-state cleanup in FIX 1).
vi.mock('@/features/settings/components/RevokeApiKeyDialog.vue', () => ({
  default: defineComponent({
    name: 'RevokeApiKeyDialogStub',
    props: ['open', 'apiKey'],
    emits: ['update:open'],
    template:
      '<div v-if="open" data-testid="revoke-dialog"><span data-testid="revoke-dialog-name">{{ apiKey?.name }}</span><span data-testid="revoke-dialog-prefix">{{ apiKey?.keyPrefix }}</span></div>',
  }),
}))

// ==========================================
// Test Data
// ==========================================

function makeKey(overrides: Partial<ApiKey> = {}): ApiKey {
  return {
    id: 'key-default',
    name: 'Default Key',
    keyPrefix: 'cttak_default',
    scopes: ['READ'],
    lastUsedAt: null,
    expiresAt: null,
    revokedAt: null,
    createdAt: '2026-01-01T00:00:00Z',
    status: 'ACTIVE',
    ...overrides,
  }
}

const activeKey = makeKey({
  id: 'key-active-1',
  name: 'Production Key',
  keyPrefix: 'cttak_prod1234',
})

const expiredKey = makeKey({
  id: 'key-expired-1',
  name: 'Old CI Key',
  keyPrefix: 'cttak_ci5678',
  status: 'EXPIRED',
})

const revokedKey = makeKey({
  id: 'key-revoked-1',
  name: 'Leaked Key',
  keyPrefix: 'cttak_leak9abc',
  status: 'REVOKED',
})

// ==========================================
// Helpers
// ==========================================

function setKeys(keys: ApiKey[] | undefined): void {
  queryData.value = keys
  queryIsPending.value = false
  queryIsError.value = false
}

function resetMocks(): void {
  vi.clearAllMocks()
  mockMutate.mockClear()
  mockRefetch.mockClear()
  pendingState.value = false
  queryData.value = undefined
  queryIsPending.value = false
  queryIsError.value = false
}

// ==========================================
// Tests
// ==========================================

describe('ApiKeysView', () => {
  beforeEach(() => {
    resetMocks()
  })

  describe('Revoke button visibility', () => {
    it('renders Revoke only for ACTIVE keys and hides it for EXPIRED/REVOKED', () => {
      setKeys([activeKey, expiredKey, revokedKey])
      const wrapper = mount(ApiKeysView)

      const rows = wrapper.findAll('tbody tr')
      expect(rows).toHaveLength(3)

      const activeRowButtons = rows[0]!.findAll('button')
      const expiredRowButtons = rows[1]!.findAll('button')
      const revokedRowButtons = rows[2]!.findAll('button')

      expect(activeRowButtons.some((b) => b.text().includes('Revoke'))).toBe(true)
      expect(expiredRowButtons.some((b) => b.text().includes('Revoke'))).toBe(false)
      expect(revokedRowButtons.some((b) => b.text().includes('Revoke'))).toBe(false)
    })

    it('renders no Revoke button when all keys are non-ACTIVE', () => {
      setKeys([expiredKey, revokedKey])
      const wrapper = mount(ApiKeysView)

      const revokeButtons = wrapper.findAll('button').filter((b) => b.text().includes('Revoke'))
      expect(revokeButtons).toHaveLength(0)
    })
  })

  describe('Revoke dialog wiring', () => {
    it('opens the revoke dialog with the clicked key name and prefix', async () => {
      setKeys([activeKey])
      const wrapper = mount(ApiKeysView)

      expect(wrapper.find('[data-testid="revoke-dialog"]').exists()).toBe(false)

      const revokeButton = wrapper.findAll('button').find((b) => b.text().includes('Revoke'))
      await revokeButton!.trigger('click')

      const dialog = wrapper.find('[data-testid="revoke-dialog"]')
      expect(dialog.exists()).toBe(true)
      expect(wrapper.find('[data-testid="revoke-dialog-name"]').text()).toBe(activeKey.name)
      expect(wrapper.find('[data-testid="revoke-dialog-prefix"]').text()).toBe(activeKey.keyPrefix)
    })

    it('reflects a revoked key after list refresh: status badge REVOKED and Revoke button gone', async () => {
      // Simulates the post-revoke query invalidation → refetch returning the
      // updated row (the composable invalidation itself is covered by
      // useApiKeys.test.ts); this asserts the view reacts correctly.
      setKeys([activeKey])
      const wrapper = mount(ApiKeysView)

      expect(wrapper.findAll('button').some((b) => b.text().includes('Revoke'))).toBe(true)

      const revokedCopy = makeKey({
        id: activeKey.id,
        name: activeKey.name,
        keyPrefix: activeKey.keyPrefix,
        status: 'REVOKED',
        revokedAt: '2026-08-04T00:00:00Z',
      })
      setKeys([revokedCopy])
      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('button').some((b) => b.text().includes('Revoke'))).toBe(false)
      const revokedBadge = wrapper.findAll('tbody tr')[0]!.find('[data-variant="destructive"]')
      expect(revokedBadge.exists()).toBe(true)
      expect(revokedBadge.text()).toBe('REVOKED')
    })

    it('passes a fresh key when opening the dialog for a different row', async () => {
      const secondActive = makeKey({
        id: 'key-active-2',
        name: 'Staging Key',
        keyPrefix: 'cttak_staging',
        status: 'ACTIVE',
      })
      setKeys([activeKey, secondActive])
      const wrapper = mount(ApiKeysView)

      const rows = wrapper.findAll('tbody tr')
      const firstRevoke = rows[0]!.findAll('button').find((b) => b.text().includes('Revoke'))!
      await firstRevoke.trigger('click')
      expect(wrapper.find('[data-testid="revoke-dialog-name"]').text()).toBe(activeKey.name)

      const dialog = wrapper.findComponent({ name: 'RevokeApiKeyDialogStub' })
      dialog.vm.$emit('update:open', false)
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-testid="revoke-dialog"]').exists()).toBe(false)

      const secondRevoke = rows[1]!.findAll('button').find((b) => b.text().includes('Revoke'))!
      await secondRevoke.trigger('click')

      expect(wrapper.find('[data-testid="revoke-dialog-name"]').text()).toBe(secondActive.name)
      expect(wrapper.find('[data-testid="revoke-dialog-prefix"]').text()).toBe(secondActive.keyPrefix)
    })
  })
})
