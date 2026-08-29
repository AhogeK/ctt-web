import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import { ref, defineComponent, type Ref } from 'vue'
import ApiKeysView from '../ApiKeysView.vue'
import type { ApiKey } from '@/lib/schemas/api-key.schema'
import type * as Utils from '@/lib/utils'

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
  useDeleteApiKey: vi.fn<() => unknown>(() => ({
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
  Skeleton: { template: '<div data-testid="skeleton" />' },
}))

vi.mock('vue-sonner', () => ({
  toast: { success: vi.fn<() => void>(), error: vi.fn<() => void>() },
}))

vi.mock('@/lib/utils', async () => {
  const actual = await vi.importActual<typeof Utils>('@/lib/utils')
  return {
    ...actual,
    cn: (...inputs: unknown[]) => inputs.filter(Boolean).join(' '),
  }
})

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
// The title prop distinguishes the revoke instance from the delete instance
// of the shared ConfirmApiKeyActionDialog.
vi.mock('@/features/settings/components/ConfirmApiKeyActionDialog.vue', () => ({
  default: defineComponent({
    name: 'ConfirmApiKeyActionDialogStub',
    props: ['open', 'apiKey', 'title'],
    emits: ['update:open'],
    template: `<div v-if="open" :data-testid="title === 'Delete API Key' ? 'delete-dialog' : 'revoke-dialog'">
      <span :data-testid="title === 'Delete API Key' ? 'delete-dialog-name' : 'revoke-dialog-name'">{{ apiKey?.name }}</span>
      <span :data-testid="title === 'Delete API Key' ? 'delete-dialog-prefix' : 'revoke-dialog-prefix'">{{ apiKey?.keyPrefix }}</span>
    </div>`,
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

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Revoke/Delete button visibility', () => {
    it('renders Revoke for ACTIVE, Delete for REVOKED and EXPIRED', () => {
      setKeys([activeKey, expiredKey, revokedKey])
      const wrapper = mount(ApiKeysView)

      const rows = wrapper.findAll('tbody tr')
      expect(rows).toHaveLength(3)

      const activeRowButtons = rows[0]!.findAll('button')
      const expiredRowButtons = rows[1]!.findAll('button')
      const revokedRowButtons = rows[2]!.findAll('button')

      expect(activeRowButtons.some((b) => b.text().includes('Revoke'))).toBe(true)
      expect(activeRowButtons.some((b) => b.text().includes('Delete'))).toBe(false)
      // EXPIRED keys cannot be reactivated and the backend (v0.42.0) deletes
      // them directly — no revoke round trip needed.
      expect(expiredRowButtons.some((b) => b.text().includes('Revoke'))).toBe(false)
      expect(expiredRowButtons.some((b) => b.text().includes('Delete'))).toBe(true)
      expect(revokedRowButtons.some((b) => b.text().includes('Revoke'))).toBe(false)
      expect(revokedRowButtons.some((b) => b.text().includes('Delete'))).toBe(true)
    })
  })

  describe('Delete dialog wiring', () => {
    it('opens the delete dialog with the clicked REVOKED key name and prefix', async () => {
      setKeys([revokedKey])
      const wrapper = mount(ApiKeysView)

      expect(wrapper.find('[data-testid="delete-dialog"]').exists()).toBe(false)

      const deleteButton = wrapper.findAll('button').find((b) => b.text().includes('Delete'))
      await deleteButton!.trigger('click')

      const dialog = wrapper.find('[data-testid="delete-dialog"]')
      expect(dialog.exists()).toBe(true)
      expect(wrapper.find('[data-testid="delete-dialog-name"]').text()).toBe(revokedKey.name)
      expect(wrapper.find('[data-testid="delete-dialog-prefix"]').text()).toBe(revokedKey.keyPrefix)
    })

    it('closes the delete dialog and clears the selected key on update:open false', async () => {
      setKeys([revokedKey])
      const wrapper = mount(ApiKeysView)

      const deleteButton = wrapper.findAll('button').find((b) => b.text().includes('Delete'))
      await deleteButton!.trigger('click')
      expect(wrapper.find('[data-testid="delete-dialog"]').exists()).toBe(true)

      // Close via the dialog stub; the selected key must be cleared so the
      // dialog unmounts (no stale key lingers).
      const dialogStub = wrapper.findComponent({ name: 'ConfirmApiKeyActionDialogStub' })
      dialogStub.vm.$emit('update:open', false)
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="delete-dialog"]').exists()).toBe(false)
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

      const dialog = wrapper.findComponent({ name: 'ConfirmApiKeyActionDialogStub' })
      dialog.vm.$emit('update:open', false)
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-testid="revoke-dialog"]').exists()).toBe(false)

      const secondRevoke = rows[1]!.findAll('button').find((b) => b.text().includes('Revoke'))!
      await secondRevoke.trigger('click')

      expect(wrapper.find('[data-testid="revoke-dialog-name"]').text()).toBe(secondActive.name)
      expect(wrapper.find('[data-testid="revoke-dialog-prefix"]').text()).toBe(secondActive.keyPrefix)
    })
  })

  describe('First-load skeleton minimum display', () => {
    it('keeps the skeleton visible for at least 300ms when the query resolves quickly', async () => {
      vi.useFakeTimers()

      queryData.value = undefined
      queryIsPending.value = true
      queryIsError.value = false

      const wrapper = mount(ApiKeysView)
      expect(wrapper.find('[data-testid="skeleton"]').exists()).toBe(true)

      vi.advanceTimersByTime(100)
      queryIsPending.value = false
      queryData.value = [activeKey]
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="skeleton"]').exists()).toBe(true)
      expect(wrapper.find('tbody tr').exists()).toBe(false)

      vi.advanceTimersByTime(250)
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="skeleton"]').exists()).toBe(false)
      expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    })

    it('does not show the skeleton during a background refetch when data is already cached', async () => {
      vi.useFakeTimers()

      queryData.value = [activeKey]
      queryIsPending.value = true
      queryIsError.value = false

      const wrapper = mount(ApiKeysView)

      expect(wrapper.find('[data-testid="skeleton"]').exists()).toBe(false)
      expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    })

    it('keeps the skeleton visible for at least 300ms on first load and hides both views', async () => {
      vi.useFakeTimers()

      queryData.value = undefined
      queryIsPending.value = true
      queryIsError.value = false

      const wrapper = mount(ApiKeysView)
      expect(wrapper.find('[data-testid="skeleton"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="api-key-cards"]').exists()).toBe(false)

      vi.advanceTimersByTime(100)
      queryIsPending.value = false
      queryData.value = [activeKey]
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="skeleton"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="api-key-cards"]').exists()).toBe(false)

      vi.advanceTimersByTime(250)
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="skeleton"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="api-key-cards"]').exists()).toBe(true)
      expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    })

    it('keeps the skeleton visible for at least 300ms when the query errors quickly', async () => {
      vi.useFakeTimers()

      queryData.value = undefined
      queryIsPending.value = true
      queryIsError.value = false

      const wrapper = mount(ApiKeysView)
      expect(wrapper.find('[data-testid="skeleton"]').exists()).toBe(true)

      vi.advanceTimersByTime(100)
      queryIsPending.value = false
      queryIsError.value = true
      await wrapper.vm.$nextTick()

      // Error state must not preempt the 300ms skeleton window.
      expect(wrapper.find('[data-testid="skeleton"]').exists()).toBe(true)

      vi.advanceTimersByTime(250)
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="skeleton"]').exists()).toBe(false)
      expect(wrapper.text()).toContain('Failed to load API keys')
    })
  })

  describe('Accessibility', () => {
    it('renders a visually hidden table caption for screen readers', () => {
      setKeys([activeKey])
      const wrapper = mount(ApiKeysView)

      const caption = wrapper.find('caption')
      expect(caption.exists()).toBe(true)
      expect(caption.text()).toBe('API keys')
      expect(caption.classes()).toContain('sr-only')
    })

    it('adds a descriptive aria-label to each Revoke button', () => {
      setKeys([activeKey])
      const wrapper = mount(ApiKeysView)

      const revokeButton = wrapper.findAll('button').find((b) => b.text().includes('Revoke'))
      expect(revokeButton).toBeDefined()
      expect(revokeButton!.attributes('aria-label')).toBe(`Revoke ${activeKey.name}`)
    })
  })

  describe('Mobile card view', () => {
    it('renders one card per key with name, prefix and status', () => {
      setKeys([activeKey, expiredKey, revokedKey])
      const wrapper = mount(ApiKeysView)

      const tableContainer = wrapper.find('[data-testid="api-key-table"]')
      expect(tableContainer.exists()).toBe(true)
      expect(tableContainer.find('table').exists()).toBe(true)

      const cardContainer = wrapper.find('[data-testid="api-key-cards"]')
      expect(cardContainer.exists()).toBe(true)

      const cards = cardContainer.findAll('[data-testid="api-key-card"]')
      expect(cards).toHaveLength(3)

      expect(cards[0]!.text()).toContain(activeKey.name)
      // break-all + min-w-0 keep the name inside the card, badge intact
      expect(cards[0]!.find('span.font-medium')!.classes()).toContain('break-all')
      expect(cards[0]!.text()).toContain(activeKey.keyPrefix)
      expect(cards[0]!.text()).toContain(activeKey.status)

      expect(cards[1]!.text()).toContain(expiredKey.name)
      expect(cards[2]!.text()).toContain(revokedKey.name)
    })

    it('shows Delete on EXPIRED and REVOKED cards, Revoke only on ACTIVE', () => {
      setKeys([activeKey, expiredKey, revokedKey])
      const wrapper = mount(ApiKeysView)

      const cards = wrapper.find('[data-testid="api-key-cards"]').findAll('[data-testid="api-key-card"]')
      expect(cards).toHaveLength(3)

      const activeCardButtons = cards[0]!.findAll('button')
      const expiredCardButtons = cards[1]!.findAll('button')
      const revokedCardButtons = cards[2]!.findAll('button')

      const activeRevokeButton = activeCardButtons.find((b) => b.text().includes('Revoke'))
      expect(activeRevokeButton).toBeDefined()
      expect(activeRevokeButton!.attributes('aria-label')).toBe(`Revoke ${activeKey.name}`)

      const expiredDeleteButton = expiredCardButtons.find((b) => b.text().includes('Delete'))
      expect(expiredDeleteButton).toBeDefined()
      expect(expiredDeleteButton!.attributes('aria-label')).toBe(`Delete ${expiredKey.name}`)

      const revokedDeleteButton = revokedCardButtons.find((b) => b.text().includes('Delete'))
      expect(revokedDeleteButton).toBeDefined()
      expect(revokedDeleteButton!.attributes('aria-label')).toBe(`Delete ${revokedKey.name}`)
    })

    it('card metadata renders relative time and Never values', () => {
      setKeys([activeKey])
      const wrapper = mount(ApiKeysView)

      const cardContainer = wrapper.find('[data-testid="api-key-cards"]')
      expect(cardContainer.text()).toContain('Last used')
      expect(cardContainer.text()).toContain('Created')
      expect(cardContainer.text()).toContain('Expires')
      expect(cardContainer.text()).toContain('Never')
    })

    it('opens the revoke dialog with the clicked card key', async () => {
      setKeys([activeKey, expiredKey])
      const wrapper = mount(ApiKeysView)

      const activeCard = wrapper.find('[data-testid="api-key-cards"]').findAll('[data-testid="api-key-card"]')[0]!
      const cardRevokeButton = activeCard.findAll('button').find((b) => b.text().includes('Revoke'))!
      await cardRevokeButton.trigger('click')

      const dialog = wrapper.find('[data-testid="revoke-dialog"]')
      expect(dialog.exists()).toBe(true)
      expect(wrapper.find('[data-testid="revoke-dialog-name"]').text()).toBe(activeKey.name)
      expect(wrapper.find('[data-testid="revoke-dialog-prefix"]').text()).toBe(activeKey.keyPrefix)
    })
  })

  describe('Column date formatting', () => {
    it('shows relative time and a readable tooltip instead of the raw ISO string (desktop)', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-01-02T01:00:00Z'))

      const key = makeKey({ createdAt: '2026-01-02T00:00:00Z' })
      setKeys([key])
      const wrapper = mount(ApiKeysView)

      // Created is the 6th column: Name, Key Prefix, Scopes, Status, Last Used, Created
      const createdCell = wrapper.findAll('tbody tr')[0]!.findAll('td')[5]!
      expect(createdCell.text()).toBe('1h ago')
      expect(createdCell.find('span').attributes('title')).toBe(new Date(key.createdAt).toLocaleString())
    })

    it('shows readable tooltips for Last Used and Expires (desktop)', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-01-02T01:00:00Z'))

      const key = makeKey({
        lastUsedAt: '2026-01-02T00:00:00Z',
        expiresAt: '2026-02-01T00:00:00Z',
      })
      setKeys([key])
      const wrapper = mount(ApiKeysView)

      // Last Used is the 5th column, Expires is the 7th (Name, Key Prefix, Scopes, Status, Last Used, Created, Expires)
      const cells = wrapper.findAll('tbody tr')[0]!.findAll('td')
      const lastUsedCell = cells[4]!
      const expiresCell = cells[6]!
      expect(lastUsedCell.find('span').attributes('title')).toBe(new Date(key.lastUsedAt!).toLocaleString())
      expect(expiresCell.find('span').attributes('title')).toBe(new Date(key.expiresAt!).toLocaleString())
    })

    it('mobile cards use the same relative time and readable tooltip for Created', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-01-02T01:00:00Z'))

      const key = makeKey({ createdAt: '2026-01-02T00:00:00Z' })
      setKeys([key])
      const wrapper = mount(ApiKeysView)

      const card = wrapper.find('[data-testid="api-key-cards"]').find('[data-testid="api-key-card"]')!
      // In this fixture lastUsedAt/expiresAt are null, so Created is the only
      // span carrying a title attribute.
      const createdSpan = card.findAll('span').find((s) => s.attributes('title') !== undefined)!
      expect(createdSpan.text()).toBe('1h ago')
      expect(createdSpan.attributes('title')).toBe(new Date(key.createdAt).toLocaleString())
    })

    it('mobile cards show readable tooltips for Last Used and Expires', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-01-02T01:00:00Z'))

      const key = makeKey({
        lastUsedAt: '2026-01-02T00:00:00Z',
        expiresAt: '2026-02-01T00:00:00Z',
      })
      setKeys([key])
      const wrapper = mount(ApiKeysView)

      const card = wrapper.find('[data-testid="api-key-cards"]').find('[data-testid="api-key-card"]')!
      const titles = card
        .findAll('span')
        .map((s) => s.attributes('title'))
        .filter((t) => t !== undefined)
      expect(titles).toContain(new Date(key.lastUsedAt!).toLocaleString())
      expect(titles).toContain(new Date(key.expiresAt!).toLocaleString())
    })
  })
})
