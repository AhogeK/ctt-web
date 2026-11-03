/**
 * Whether a passkey was set up or used on this browser.
 *
 * The page cannot ask the authenticator what it holds without starting a ceremony, and a ceremony
 * on every visit would open a system picker for people who have no passkey at all. Remembering the
 * fact that one was created or used here is the honest middle ground: that reader is offered it
 * immediately on the next visit, and everyone else keeps the ordinary form.
 *
 * The scope is this browser, not the account: before anyone types an address the login page has no
 * account to ask about, and enumerating accounts by email would answer "does this address have a
 * passkey" for anyone. What a shared machine costs is one extra system prompt, and answering that
 * prompt still needs the owner's own verification.
 */
const STORAGE_KEY = 'ctt.passkey-used'

/** Records that a passkey was just set up or used on this browser. */
export function rememberPasskeyUse(): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, '1')
  } catch {
    // A browser that refuses storage still works: the offer simply stays behind the button.
  }
}

/** @returns whether a passkey was set up or used here before. */
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
