import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'

const errorToast = vi.hoisted(() => vi.fn<(title: string, options?: unknown) => void>())

vi.mock('vue-sonner', () => ({ toast: { error: errorToast, success: vi.fn<() => void>(), info: vi.fn<() => void>() } }))
vi.mock('@/i18n', () => ({
  i18n: {
    global: { t: (key: string, named?: Record<string, unknown>) => (named ? `${key}:${JSON.stringify(named)}` : key) },
  },
}))

/** The shim ofetch throws: a status, never a `code` unless the body carried one. */
const httpFailure = (statusCode: number, data?: unknown) => ({ statusCode, statusMessage: 'x', data })

describe('operation failure reporter', () => {
  beforeEach(() => {
    vi.resetModules()
    errorToast.mockReset()
  })

  it('uses the catalogue sentence when the error carries a known code', async () => {
    const { reportOperationFailure } = await import('../operation-failure')

    const spoke = reportOperationFailure(httpFailure(401, { code: 'AUTH_033' }))

    expect(spoke).toBe(true)
    expect(errorToast).toHaveBeenCalledTimes(1)
    expect(errorToast.mock.calls[0]![0]).toBe('api.errors.auth033')
  })

  it('falls back to the generic pair when nothing names the failure', async () => {
    const { reportOperationFailure } = await import('../operation-failure')

    reportOperationFailure(httpFailure(500))

    expect(errorToast.mock.calls[0]![0]).toBe('app.failure.title')
    expect(errorToast.mock.calls[0]![1]).toEqual({ description: 'app.failure.body' })
  })

  it('says one sentence for one error, however many layers see it', async () => {
    const { reportOperationFailure, markFailureReported } = await import('../operation-failure')
    const error = httpFailure(500)

    markFailureReported(error)
    expect(reportOperationFailure(error)).toBe(false)
    expect(reportOperationFailure(error)).toBe(false)
    expect(errorToast).not.toHaveBeenCalled()
  })

  it('turns a burst of identical failures into one toast', async () => {
    const { reportOperationFailure } = await import('../operation-failure')

    reportOperationFailure(httpFailure(500))
    reportOperationFailure(httpFailure(503))
    reportOperationFailure({ name: 'FetchError' })

    // Same words, same instant: a second toast would be noise, not information.
    expect(errorToast).toHaveBeenCalledTimes(1)
  })

  it('stays quiet when the reader cancelled a prompt', async () => {
    const { reportOperationFailure } = await import('../operation-failure')

    expect(reportOperationFailure(new DOMException('dismissed', 'AbortError'))).toBe(false)
    expect(reportOperationFailure(new DOMException('dismissed', 'NotAllowedError'))).toBe(false)
    expect(errorToast).not.toHaveBeenCalled()
  })

  it('leaves AUTH_001 to the layer that signs the reader out', async () => {
    const { reportOperationFailure } = await import('../operation-failure')

    expect(reportOperationFailure(httpFailure(401, { code: 'AUTH_001' }))).toBe(false)
    expect(errorToast).not.toHaveBeenCalled()
  })
})
