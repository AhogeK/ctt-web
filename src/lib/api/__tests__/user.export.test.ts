import { describe, it, expect, vi, beforeEach } from 'vite-plus/test'
import * as userApi from '@/lib/api/user'
import { apiFetch } from '@/lib/api/instance'

vi.mock('../instance', () => ({
  apiFetch: vi.fn<() => Promise<unknown>>(),
}))

describe('downloadUserExport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('requests the export as a blob with the browser timezone offset', async () => {
    const blob = new Blob(['{"exportVersion":"1.0"}'], { type: 'application/json' })
    vi.mocked(apiFetch).mockImplementation(async (_url: unknown, options: unknown) => {
      const onResponse = (options as { onResponse?: (ctx: unknown) => unknown }).onResponse
      await onResponse?.({
        response: {
          headers: new Headers({
            'Content-Disposition': 'attachment; filename="ctt-export-2026-07-09.json"',
          }),
        },
      })
      return blob
    })

    const result = await userApi.downloadUserExport()

    expect(apiFetch).toHaveBeenCalledWith(
      '/api/v1/users/me/export',
      expect.objectContaining({
        method: 'GET',
        responseType: 'blob',
        query: { timezoneOffset: expect.any(Number) },
      }),
    )
    expect(result.blob).toBe(blob)
  })

  it('takes the file name from the response header', async () => {
    vi.mocked(apiFetch).mockImplementation(async (_url: unknown, options: unknown) => {
      const onResponse = (options as { onResponse?: (ctx: unknown) => unknown }).onResponse
      await onResponse?.({
        response: {
          headers: new Headers({
            'Content-Disposition': 'attachment; filename="ctt-export-2026-07-09.json"',
          }),
        },
      })
      return new Blob(['{}'], { type: 'application/json' })
    })

    const result = await userApi.downloadUserExport()

    expect(result.filename).toBe('ctt-export-2026-07-09.json')
  })

  it('falls back to a name of its own when the server sends no file name', async () => {
    vi.mocked(apiFetch).mockResolvedValue(new Blob(['{}'], { type: 'application/json' }))

    const result = await userApi.downloadUserExport()

    expect(result.filename).toMatch(/^ctt-export-\d{8}\.json$/)
  })
})
