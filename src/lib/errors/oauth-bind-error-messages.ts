/**
 * User-facing error messages for OAuth account BIND failures.
 *
 * The backend (ctt-server) redirects to `{frontendUrl}/settings/profile?linked={provider}&error={errorCode}`
 * when an OAuth BIND attempt fails. This module maps those backend error codes to
 * user-friendly toast messages displayed in the ProfileView.
 *
 * Reference: ctt-server dev-docs/oauth/frontend-integration.md (kept in sync with this file)
 *
 * NOTE: For the LOGIN flow errors (OAuthErrorView.vue), a separate mapping exists
 * with overlapping but distinct copy tailored to the "Sign in failed" page UX.
 * If you update messages here, consider whether the LOGIN flow messages need the
 * same update — but they are deliberately kept separate to allow independent evolution.
 */

export const OAUTH_BIND_ERROR_MESSAGES: Record<string, string> = {
  AUTH_006: 'Your account is not active. Please verify your email.',
  AUTH_013: 'Authorization request expired. Please try again.',
  AUTH_016: 'This GitHub account is already linked to another user.',
  USER_004: 'User not found.',
  OAUTH_PROVIDER_ERROR: 'GitHub authorization failed.',
  OAUTH_INTERNAL_ERROR: 'Service error. Please try again later.',
  MISSING_OAUTH_PARAMS: 'Invalid authorization response.',
  INVALID_STATE_ACTION: 'Authorization request invalid.',
}

/**
 * Resolves the user-friendly message for an OAuth BIND error code.
 * Returns a default fallback message for unknown / missing codes.
 *
 * @param code - Backend error code (e.g. "AUTH_016") from the BIND failure redirect
 * @returns User-friendly message suitable for display in a toast notification
 */
export function getOAuthBindErrorMessage(code: string): string {
  const message = OAUTH_BIND_ERROR_MESSAGES[code]
  if (!message) {
    // Dev breadcrumb: surfaces unmapped codes so future-proofing the mapping
    // table is auditable. The user-facing fallback message is preserved —
    // this console.warn never leaks to the UI.
    if (typeof console !== 'undefined') {
      console.warn(`[oauth-bind] unmapped error code: ${code}`)
    }
    return 'Failed to connect GitHub. Please try again.'
  }
  return message
}
