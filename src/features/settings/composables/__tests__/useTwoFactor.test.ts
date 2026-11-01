import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { useMutation, useQuery } from '@tanstack/vue-query'
import * as api from '@/lib/api/two-factor'
import {
  TWO_FACTOR_STATUS_QUERY_KEY,
  useConfirmTwoFactorSetup,
  useDisableTwoFactor,
  useRegenerateRecoveryCodes,
  useStartTwoFactorSetup,
  useTwoFactorStatus,
} from '../useTwoFactor'

vi.mock('@/lib/api/two-factor', () => ({
  fetchTwoFactorStatus: vi.fn<() => Promise<unknown>>(),
  startTotpSetup: vi.fn<() => Promise<unknown>>(),
  confirmTotpSetup: vi.fn<() => Promise<unknown>>(),
  disableTwoFactor: vi.fn<() => Promise<unknown>>(),
  regenerateRecoveryCodes: vi.fn<() => Promise<unknown>>(),
}))

const mockInvalidateQueries = vi.fn<(...args: unknown[]) => Promise<void>>()

vi.mock('@tanstack/vue-query', () => ({
  useQueryClient: vi.fn<() => { invalidateQueries: typeof mockInvalidateQueries }>(() => ({
    invalidateQueries: mockInvalidateQueries,
  })),
  useQuery: vi.fn<(config: unknown) => unknown>((config: unknown) => ({ ...(config as object), data: undefined })),
  useMutation: vi.fn<(config: unknown) => unknown>((config: unknown) => ({
    ...(config as object),
    mutate: vi.fn<() => void>(),
  })),
}))

type MutableConfig = {
  queryFn?: () => Promise<unknown>
  mutationFn?: (variables: unknown) => Promise<unknown>
  onSettled?: () => void
}

function configOf(call: unknown): MutableConfig {
  return call as MutableConfig
}

describe('useTwoFactor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reads the status under the key the mutations will invalidate', async () => {
    useTwoFactorStatus()

    const config = configOf(vi.mocked(useQuery).mock.calls.at(-1)?.[0])
    expect((config as unknown as { queryKey: readonly string[] }).queryKey).toEqual(TWO_FACTOR_STATUS_QUERY_KEY)

    await config.queryFn?.()
    expect(api.fetchTwoFactorStatus).toHaveBeenCalledTimes(1)
  })

  it('starts a setup with or without a password', async () => {
    useStartTwoFactorSetup()

    const config = configOf(vi.mocked(useMutation).mock.calls.at(-1)?.[0])
    await config.mutationFn?.('SecurePass1!')
    await config.mutationFn?.(undefined)

    expect(api.startTotpSetup).toHaveBeenNthCalledWith(1, 'SecurePass1!')
    expect(api.startTotpSetup).toHaveBeenNthCalledWith(2, undefined)
  })

  it('confirms, disables and regenerates, refreshing the status each time', async () => {
    useConfirmTwoFactorSetup()
    const confirm = configOf(vi.mocked(useMutation).mock.calls.at(-1)?.[0])
    await confirm.mutationFn?.('123456')
    expect(api.confirmTotpSetup).toHaveBeenCalledWith('123456')
    confirm.onSettled?.()
    expect(mockInvalidateQueries).toHaveBeenLastCalledWith({ queryKey: TWO_FACTOR_STATUS_QUERY_KEY })

    useDisableTwoFactor()
    const disable = configOf(vi.mocked(useMutation).mock.calls.at(-1)?.[0])
    await disable.mutationFn?.({ code: '123456' })
    expect(api.disableTwoFactor).toHaveBeenCalledWith({ code: '123456' })
    disable.onSettled?.()
    expect(mockInvalidateQueries).toHaveBeenLastCalledWith({ queryKey: TWO_FACTOR_STATUS_QUERY_KEY })

    useRegenerateRecoveryCodes()
    const regenerate = configOf(vi.mocked(useMutation).mock.calls.at(-1)?.[0])
    await regenerate.mutationFn?.({ recoveryCode: 'KYQV-BATK' })
    expect(api.regenerateRecoveryCodes).toHaveBeenCalledWith({ recoveryCode: 'KYQV-BATK' })
    regenerate.onSettled?.()
    expect(mockInvalidateQueries).toHaveBeenLastCalledWith({ queryKey: TWO_FACTOR_STATUS_QUERY_KEY })
  })
})
