/**
 * Ties an OAuth callback to the tab that started the flow.
 *
 * The provider returns the tokens on the callback URL, so a link a stranger sends would otherwise
 * sign the reader into that stranger's account: the browser cannot tell a hand-off the reader began
 * from one a link produced. A tab-scoped marker, set when the sign-in page starts the redirect and
 * consumed by the callback, is something only an in-app start can produce.
 *
 * It is one layer, not the whole answer: a body that echoes a server-issued `state` is what closes
 * the remaining gap, and that lives on the API. The marker is defence in depth, so a browser that
 * refuses storage fails open — refusing the callback would lock those readers out of OAuth login
 * entirely, which is worse than the attack this stops.
 */
const MARKER_KEY = 'ctt.oauth-flow'

/** Records that this tab is leaving for the provider, so its callback can be trusted. */
export function markOAuthFlowStarted(): void {
  try {
    globalThis.sessionStorage?.setItem(MARKER_KEY, '1')
  } catch {
    // Storage refused: the callback still works, just without this extra check.
  }
}

/**
 * Reads and clears the marker.
 *
 * @returns whether this tab started the flow; true when storage is unavailable, so a blocked
 * storage API cannot make the provider flow unreachable
 */
export function consumeOAuthFlowMarker(): boolean {
  try {
    const storage = globalThis.sessionStorage
    // No storage at all behaves like the throwing case below: the flow stays reachable.
    if (!storage) return true
    const started = storage.getItem(MARKER_KEY) === '1'
    storage.removeItem(MARKER_KEY)
    return started
  } catch {
    return true
  }
}
