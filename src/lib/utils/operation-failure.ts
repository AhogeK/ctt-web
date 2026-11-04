import { toast } from 'vue-sonner'
import { i18n } from '@/i18n'
import { extractErrorCode, isApiError, mapApiErrorCode } from './api-error'

/**
 * One entry point for "this action did not go through".
 *
 * A request can fail in places its caller never sees: a mutation with no handler, a promise nobody
 * awaited, an error code the page has no copy for. Without a single place that speaks, those
 * failures look like a button that did nothing.
 *
 * The rules here keep the fallback quiet where it should be:
 * - the reader backing out of a prompt is not a failure;
 * - `AUTH_001` is already handled by the fetch layer, which signs the reader out;
 * - an error that some site already explained is claimed through {@link markFailureReported}, so it
 *   is never said twice;
 * - the same copy within {@link DUPLICATE_WINDOW_MS} is one toast, not a stack of them.
 */

/** Copy repeated inside this window is the same message, not a second failure. */
const DUPLICATE_WINDOW_MS = 4000

/** Errors that exist because the reader changed their mind. */
const CANCELLATION_NAMES = new Set(['AbortError', 'NotAllowedError'])

/** Errors already shown to the reader, whichever layer showed them. */
const spoken = new WeakSet<object>()

/** The last copy spoken, keyed by its text, so a burst of failures reads as one. */
const lastSpokenAt = new Map<string, number>()

/**
 * Whether an error is the reader backing out rather than the app failing.
 *
 * `navigator.credentials.get()` rejects with `NotAllowedError` when the prompt is dismissed, and an
 * aborted fetch rejects with `AbortError`. Neither deserves an error message.
 *
 * @param error - The value thrown, of any shape
 * @returns true when nothing should be shown
 */
function isUserCancellation(error: unknown): boolean {
  return error instanceof DOMException && CANCELLATION_NAMES.has(error.name)
}

/**
 * The copy for one failure.
 *
 * A code the catalogue knows gets its own sentence; anything else — a bare `FetchError`, a 500 with
 * no body, an error object from outside the API — gets the generic pair. Codes themselves never
 * reach the page.
 *
 * @param error - The value thrown, of any shape
 * @returns The title and, when it adds something, a second line
 */
function describeFailure(error: unknown): { title: string; body: string | null } {
  const t = i18n.global.t
  const code = extractErrorCode(error)

  if (code) {
    return { title: mapApiErrorCode(code), body: null }
  }
  return { title: t('app.failure.title'), body: t('app.failure.body') }
}

/**
 * Claims an error for a caller that shows its own wording.
 *
 * Call this before a handler sets inline text or shows its own toast: the last-resort handler then
 * knows the reader has already been told, and stays quiet.
 *
 * @param error - The error the caller is about to explain
 */
export function markFailureReported(error: unknown): void {
  if (typeof error === 'object' && error !== null) spoken.add(error)
}

/**
 * Whether this exact error was already explained.
 *
 * @param error - The value thrown, of any shape
 * @returns true when a message about it already exists
 */
export function wasFailureReported(error: unknown): boolean {
  return typeof error === 'object' && error !== null && spoken.has(error)
}

/**
 * Tells the reader that an action failed, unless someone already did.
 *
 * @param error - The value thrown, of any shape
 * @returns true when this call is the one that spoke
 */
export function reportOperationFailure(error: unknown): boolean {
  if (isUserCancellation(error)) return false
  if (extractErrorCode(error) === 'AUTH_001') return false
  if (typeof error === 'object' && error !== null) {
    if (spoken.has(error)) return false
    spoken.add(error)
  }

  // An HTTP answer the catalogue has no copy for is still worth a sentence; a thrown value that is
  // not an API error usually means the request never landed.
  const { title, body } = describeFailure(error)
  const key = `${title}\u0000${body ?? ''}`
  const now = Date.now()
  const last = lastSpokenAt.get(key)
  if (last !== undefined && now - last < DUPLICATE_WINDOW_MS) return false
  lastSpokenAt.set(key, now)

  if (!isApiError(error)) {
    console.warn('[operation] failed', error)
  }

  toast.error(title, body ? { description: body } : undefined)
  return true
}
