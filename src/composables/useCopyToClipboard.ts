import { ref, onUnmounted } from 'vue'

/**
 * Composable for copying text to the clipboard with progressive fallback.
 *
 * Attempts, in order:
 * 1. `navigator.clipboard.writeText` (modern async API, requires secure context)
 * 2. `document.execCommand('copy')` via a hidden textarea (legacy fallback)
 * 3. Returns `false` so the caller can prompt the user to select and copy manually
 *
 * Exposes a `copied` flag that flips to true for 2 seconds after a successful
 * copy, letting UI show feedback ("Copied ✓") before reverting.
 *
 * @returns Object with `copied` reactive flag and `copy` async function
 */
export function useCopyToClipboard() {
  const copied = ref(false)
  let resetTimer: ReturnType<typeof setTimeout> | null = null

  function flashCopied() {
    copied.value = true
    if (resetTimer) clearTimeout(resetTimer)
    resetTimer = setTimeout(() => {
      copied.value = false
    }, 2000)
  }

  /**
   * Copies `text` to the clipboard using the best available API.
   *
   * @param text - The text to copy
   * @returns `true` on success, `false` when both APIs fail (caller should offer manual copy)
   */
  async function copy(text: string): Promise<boolean> {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text)
        flashCopied()
        return true
      } catch {
        // Fall through to legacy path (e.g. insecure context, permission denied)
      }
    }

    try {
      // Legacy path: hidden textarea + execCommand('copy').
      // Style is set programmatically because the element is created at runtime,
      // not part of the component template.
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(textarea)
      if (ok) {
        flashCopied()
        return true
      }
    } catch {
      // Fall through to manual-copy signal
    }

    return false
  }

  onUnmounted(() => {
    if (resetTimer) clearTimeout(resetTimer)
  })

  return { copied, copy }
}
