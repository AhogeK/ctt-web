import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { flushPromises } from '@vue/test-utils'
import { mountWithQuery } from '@/test/mount-with-query'
import DataExportCard from '../DataExportCard.vue'

/**
 * The export hands a finished file to the browser: nothing is parsed, and the name on disk is
 * the name the server chose. Both facts are asserted here, together with the export's own
 * hourly limit — the generic rate-limit copy would tell the reader the wrong allowance.
 */

const mockDownload = vi.hoisted(() => vi.fn<() => Promise<{ blob: Blob; filename: string }>>())
const mockToastSuccess = vi.hoisted(() => vi.fn<(...args: unknown[]) => void>())
const mockToastError = vi.hoisted(() => vi.fn<(...args: unknown[]) => void>())

vi.mock('@/lib/api', () => ({
  downloadUserExport: mockDownload,
}))

vi.mock('vue-sonner', () => ({
  toast: { success: mockToastSuccess, error: mockToastError },
}))

vi.mock('@/lib/utils', () => ({
  cn: (...inputs: unknown[]) => inputs.filter(Boolean).join(' '),
}))

vi.mock('@/lib/utils/api-error', () => ({
  // The real guard only asks for a numeric status, and that is exactly what the card branches on.
  isApiError: (error: unknown) => typeof (error as { statusCode?: unknown } | null)?.statusCode === 'number',
}))

vi.mock('@/components/ui/button', () => ({
  Button: {
    props: ['disabled', 'variant'],
    template: '<button :disabled="disabled" v-bind="$attrs"><slot /></button>',
  },
}))

/** The name attribute of the anchor the component clicked, captured from the real element. */
let downloadedName: string | null = null

describe('DataExportCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    downloadedName = null

    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn<(blob: Blob) => string>(() => 'blob:test'),
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn<(url: string) => void>(),
    })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      downloadedName = this.download
    })
  })

  afterEach(() => {
    // Removed explicitly: jsdom does not implement them, and a stub left behind would silently
    // cover for the next file in this worker.
    const statics = URL as unknown as { createObjectURL?: unknown; revokeObjectURL?: unknown }
    delete statics.createObjectURL
    delete statics.revokeObjectURL
    vi.restoreAllMocks()
  })

  it('saves the document under the name the server gave it', async () => {
    mockDownload.mockResolvedValue({
      blob: new Blob(['{"exportVersion":"1.0"}'], { type: 'application/json' }),
      filename: 'ctt-export-2026-07-09.json',
    })

    const wrapper = mountWithQuery(DataExportCard)
    await wrapper.find('[data-testid="export-download"]').trigger('click')
    await flushPromises()

    expect(mockDownload).toHaveBeenCalledTimes(1)
    expect(downloadedName).toBe('ctt-export-2026-07-09.json')
    expect(mockToastSuccess).toHaveBeenCalledWith(
      'Download started',
      expect.objectContaining({ description: expect.stringContaining('ctt-export-2026-07-09.json') }),
    )
    wrapper.unmount()
  })

  it("states the export's own allowance when the hourly limit is reached", async () => {
    // A blob request cannot read the backend's code out of the error body, so the status is all
    // the card has: this fixture is what ofetch hands over for a 429 on a blob download.
    mockDownload.mockRejectedValue({ statusCode: 429, data: new Blob(['{}']) })

    const wrapper = mountWithQuery(DataExportCard)
    await wrapper.find('[data-testid="export-download"]').trigger('click')
    await flushPromises()

    expect(mockToastError).toHaveBeenCalledWith(
      'Could not prepare your export',
      expect.objectContaining({ description: expect.stringContaining('Three exports an hour') }),
    )
    expect(downloadedName).toBeNull()
    wrapper.unmount()
  })
})
