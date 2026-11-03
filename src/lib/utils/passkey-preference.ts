/**
 * Whether this browser has signed in with a passkey before.
 *
 * The page cannot ask the authenticator what it holds without starting a ceremony, and a ceremony
 * on every visit would open a system picker for people who have no passkey at all. Remembering a
 * successful use is the honest middle ground: the reader who has one is offered it immediately on
 * the next visit, and everyone else keeps the ordinary form.
 */
const STORAGE_KEY = 'ctt.passkey-used'

/** Records that a passkey just completed a sign-in on this browser. */
export function rememberPasskeyUse(): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, '1')
  } catch {
    // A browser that refuses storage still works: the offer simply stays behind the button.
  }
}

/** @returns whether a passkey has completed a sign-in here before. */
export function hasUsedPasskey(): boolean {
  try {
    return globalThis.localStorage?.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

/** Forgets the preference — used when the reader removes their last credential. */
export function forgetPasskeyUse(): void {
  try {
    globalThis.localStorage?.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to undo when storage is unavailable.
  }
}
