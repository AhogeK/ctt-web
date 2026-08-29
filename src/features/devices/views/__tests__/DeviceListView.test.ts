import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import { ref, type Ref } from 'vue'
import DeviceListView from '../DeviceListView.vue'
import type { Device } from '@/lib/schemas/device.schema'

// ==========================================
// Hoisted Mock Variables
// ==========================================

const mockMutate = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown>())
const pendingState = vi.hoisted(() => ({ value: false }))

// Real vue refs so template auto-unwrap works correctly
const queryData: Ref<Device[] | undefined> = ref(undefined)
const queryIsPending: Ref<boolean> = ref(false)
const queryIsError: Ref<boolean> = ref(false)
const mockRefetch = vi.hoisted(() => vi.fn<() => Promise<unknown>>())

// ==========================================
// Mocks
// ==========================================

vi.mock('@/composables/useDevices', () => ({
  useDevices: vi.fn<() => unknown>(() => ({
    data: queryData,
    isPending: queryIsPending,
    isError: queryIsError,
    error: ref(null),
    refetch: mockRefetch,
  })),
  useRevokeDevice: vi.fn<() => unknown>(() => ({
    mutate: mockMutate,
    isPending: pendingState,
    isError: ref(false),
    error: ref(null),
  })),
}))

vi.mock('@lucide/vue', () => ({
  Monitor: { template: '<svg data-testid="icon-monitor" />' },
  Smartphone: { template: '<svg data-testid="icon-smartphone" />' },
  Laptop: { template: '<svg data-testid="icon-laptop" />' },
  Globe: { template: '<svg data-testid="icon-globe" />' },
  Trash2: { template: '<svg data-testid="icon-trash" />' },
  Loader2: { template: '<svg data-testid="icon-loader" />' },
  AlertTriangle: { template: '<svg data-testid="icon-alert" />' },
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

vi.mock('@/components/ui/dialog', () => ({
  Dialog: {
    props: ['open'],
    template: '<div v-if="open" data-testid="dialog-root"><slot /></div>',
  },
  DialogContent: { template: '<div data-testid="dialog-content"><slot /></div>' },
  DialogDescription: { template: '<div data-testid="dialog-description"><slot /></div>' },
  DialogFooter: { template: '<div data-testid="dialog-footer"><slot /></div>' },
  DialogHeader: { template: '<div data-testid="dialog-header"><slot /></div>' },
  DialogTitle: { template: '<div data-testid="dialog-title"><slot /></div>' },
}))

// ==========================================
// Fixtures
// ==========================================

const macDevice: Device = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  deviceName: 'MacBook Pro',
  platform: 'macOS',
  ideName: 'IntelliJ IDEA',
  ideVersion: '2026.1',
  appVersion: '1.2.0',
  createdAt: '2026-08-28T10:00:00Z',
  lastSeenAt: new Date(Date.now() - 2 * 3600000).toISOString(),
}

const inactiveDevice: Device = {
  ...macDevice,
  id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  deviceName: 'Old Workstation',
  platform: 'Windows',
  lastSeenAt: new Date(Date.now() - 30 * 86400000).toISOString(),
}

beforeEach(() => {
  queryData.value = undefined
  queryIsPending.value = false
  queryIsError.value = false
  pendingState.value = false
  mockMutate.mockClear()
})

describe('DeviceListView states', () => {
  it('renders the empty state with a plugin install link', () => {
    queryData.value = []
    const wrapper = mount(DeviceListView)

    expect(wrapper.text()).toContain('No devices registered')
    const link = wrapper.find('a[href="https://github.com/AhogeK/code-time-tracker"]')
    expect(link.exists()).toBe(true)
    expect(link.text()).toBe('Install the JetBrains plugin')
  })

  it('renders device cards with name, platform, relative time and active badge', () => {
    queryData.value = [macDevice, inactiveDevice]
    const wrapper = mount(DeviceListView)

    expect(wrapper.text()).toContain('MacBook Pro')
    expect(wrapper.text()).toContain('macOS')
    expect(wrapper.text()).toContain('Last seen: 2h ago')
    expect(wrapper.text()).toContain('IntelliJ IDEA 2026.1')
    expect(wrapper.text()).toContain('Active')

    expect(wrapper.text()).toContain('Old Workstation')
    expect(wrapper.text()).toContain('Windows')
    expect(wrapper.text()).toContain('Inactive')
  })

  it('renders the error state with a retry button', async () => {
    queryIsError.value = true
    queryData.value = undefined
    const wrapper = mount(DeviceListView)

    expect(wrapper.text()).toContain('Failed to load devices')
    await wrapper.find('button').trigger('click')
    expect(mockRefetch).toHaveBeenCalled()
  })

  it('falls back to ide name when deviceName is absent', () => {
    queryData.value = [{ ...macDevice, deviceName: null }]
    const wrapper = mount(DeviceListView)
    expect(wrapper.text()).toContain('IntelliJ IDEA 2026.1')
  })
})

describe('First-load skeleton minimum display', () => {
  it('keeps the skeleton visible for at least 300ms when the query resolves quickly', async () => {
    vi.useFakeTimers()

    queryData.value = undefined
    queryIsPending.value = true
    queryIsError.value = false

    const wrapper = mount(DeviceListView)
    expect(wrapper.find('[data-testid="skeleton"]').exists()).toBe(true)

    vi.advanceTimersByTime(100)
    queryIsPending.value = false
    queryData.value = [macDevice]
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="skeleton"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('MacBook Pro')

    vi.advanceTimersByTime(250)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="skeleton"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('MacBook Pro')

    vi.useRealTimers()
  })

  it('does not show the skeleton during a background refetch when data is already cached', () => {
    vi.useFakeTimers()

    queryData.value = [macDevice]
    queryIsPending.value = true
    queryIsError.value = false

    const wrapper = mount(DeviceListView)
    expect(wrapper.find('[data-testid="skeleton"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('MacBook Pro')

    vi.useRealTimers()
  })

  it('keeps the skeleton visible when the query errors quickly', async () => {
    vi.useFakeTimers()

    queryData.value = undefined
    queryIsPending.value = true
    queryIsError.value = false

    const wrapper = mount(DeviceListView)
    expect(wrapper.find('[data-testid="skeleton"]').exists()).toBe(true)

    vi.advanceTimersByTime(100)
    queryIsPending.value = false
    queryIsError.value = true
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="skeleton"]').exists()).toBe(true)

    vi.advanceTimersByTime(250)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="skeleton"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Failed to load devices')

    vi.useRealTimers()
  })
})

describe('Device revoke flow', () => {
  it('exposes an aria-label on the revoke button naming the device', () => {
    queryData.value = [macDevice]
    const wrapper = mount(DeviceListView)

    const revoke = wrapper.find('button[aria-label="Revoke MacBook Pro"]')
    expect(revoke.exists()).toBe(true)
  })

  it('opens the confirmation dialog when revoke is clicked', async () => {
    queryData.value = [macDevice]
    const wrapper = mount(DeviceListView)

    expect(wrapper.find('[data-testid="dialog-root"]').exists()).toBe(false)

    await wrapper.find('button[aria-label="Revoke MacBook Pro"]').trigger('click')
    expect(wrapper.find('[data-testid="dialog-root"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="dialog-title"]').text()).toBe('Revoke Device Access')
    expect(wrapper.find('[data-testid="dialog-description"]').text()).toContain('MacBook Pro')
  })

  it('closes the dialog on cancel without mutating', async () => {
    queryData.value = [macDevice]
    const wrapper = mount(DeviceListView)

    await wrapper.find('button[aria-label="Revoke MacBook Pro"]').trigger('click')
    const cancel = wrapper.findAll('button').find((b) => b.text().trim() === 'Cancel')
    await cancel!.trigger('click')

    expect(wrapper.find('[data-testid="dialog-root"]').exists()).toBe(false)
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('confirms revocation with the device id and closes the dialog on success', async () => {
    mockMutate.mockImplementation((...args: unknown[]) => {
      const options = args[1] as { onSuccess?: () => void } | undefined
      options?.onSuccess?.()
    })
    queryData.value = [macDevice]
    const wrapper = mount(DeviceListView)

    await wrapper.find('button[aria-label="Revoke MacBook Pro"]').trigger('click')
    const confirm = wrapper.findAll('button').find((b) => b.text().includes('Revoke Device'))
    await confirm!.trigger('click')

    expect(mockMutate).toHaveBeenCalledWith(
      { deviceId: macDevice.id },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
    // mockMutate implementation invokes onSuccess → dialog closes
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="dialog-root"]').exists()).toBe(false)
  })
})
