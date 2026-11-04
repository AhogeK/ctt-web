import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'

const errorToast = vi.hoisted(() => vi.fn<(title: string, options?: unknown) => void>())

vi.mock('vue-sonner', () => ({ toast: { error: errorToast, success: vi.fn<() => void>(), info: vi.fn<() => void>() } }))
vi.mock('@/i18n', () => ({
  i18n: {
    global: { t: (key: string, named?: Record<string, unknown>) => (named ? `${key}:${JSON.stringify(named)}` : key) },
  },
}))

const failure = () => ({ statusCode: 500, statusMessage: 'Server Error', data: undefined })

/** Runs one mutation through the app's own client, the way a component would. */
async function runMutation(options: { onError?: () => void; perCall?: (error: unknown) => void }): Promise<void> {
  const { queryClient } = await import('../query')
  const { MutationObserver } = await import('@tanstack/vue-query')

  const observer = new MutationObserver(queryClient, {
    mutationFn: async () => {
      throw failure()
    },
    ...(options.onError ? { onError: options.onError } : {}),
  })

  // A subscriber is what makes query-core run the call-site callbacks at all.
  const unsubscribe = observer.subscribe(() => {})
  await observer.mutate(undefined, options.perCall ? { onError: options.perCall } : undefined).catch(() => undefined)
  unsubscribe()
  // The fallback waits one task so it can read a claim made by the call-site handler.
  await new Promise((resolve) => setTimeout(resolve, 5))
}

describe('the mutation-cache fallback', () => {
  beforeEach(() => {
    vi.resetModules()
    errorToast.mockReset()
  })

  it('speaks for a mutation that has no handler of its own', async () => {
    await runMutation({})

    // Without this, the click is indistinguishable from a button that does nothing.
    expect(errorToast).toHaveBeenCalledTimes(1)
    expect(errorToast.mock.calls[0]![0]).toBe('app.failure.title')
  })

  it('leaves the wording to a mutation that declares its own handler', async () => {
    await runMutation({ onError: () => {} })

    expect(errorToast).not.toHaveBeenCalled()
  })

  it('cannot see a per-call handler, so that handler has to claim the error', async () => {
    await runMutation({ perCall: () => {} })

    // Measured on query-core 5.104.5: call-site callbacks never reach `mutation.options.onError`.
    // The test states the limitation so the claiming contract stays deliberate.
    expect(errorToast).toHaveBeenCalledTimes(1)
  })

  it('says nothing twice when the call-site handler claimed the error', async () => {
    const { markFailureReported } = await import('../utils/operation-failure')

    await runMutation({
      perCall: (error) => {
        markFailureReported(error)
      },
    })

    expect(errorToast).not.toHaveBeenCalled()
  })
})
