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

import { i18n } from '@/i18n'

export const OAUTH_BIND_ERROR_MESSAGES: Record<string, string> = {
  AUTH_006: 'oauth.bind.auth006',
  AUTH_013: 'oauth.bind.auth013',
  AUTH_016: 'oauth.bind.auth016',
  USER_004: 'oauth.bind.user004',
  OAUTH_PROVIDER_ERROR: 'oauth.bind.providerError',
  OAUTH_INTERNAL_ERROR: 'oauth.bind.internalError',
  MISSING_OAUTH_PARAMS: 'oauth.bind.missingParams',
  INVALID_STATE_ACTION: 'oauth.bind.invalidStateAction',
}

/**
 * User-facing error messages for OAuth account UNBIND failures.
 *
 * Kept separate from OAUTH_BIND_ERROR_MESSAGES because the same backend
 * codes (AUTH_017, AUTH_018) carry different semantics depending on the
 * call direction: AUTH_017 means "already linked to another user" during
 * BIND but "not linked to current user" during UNBIND. Sharing a single
 * table would force one side to display a confusing message.
 *
 * Reference: ctt-server PR-B (DELETE /api/v1/auth/oauth/accounts/{provider})
 */
export const OAUTH_UNBIND_ERROR_MESSAGES: Record<string, string> = {
  // 400 — only reachable if a non-`github` provider is requested (future-proofing).
  COMMON_001: 'oauth.unbind.common001',
  AUTH_017: 'oauth.unbind.auth017',
  AUTH_018: 'oauth.unbind.auth018',
}

/**
 * Resolves the user-friendly message for an OAuth BIND error code.
 * Returns a default fallback message for unknown / missing codes.
 *
 * @param code - Backend error code (e.g. "AUTH_016") from the BIND failure redirect
 * @returns User-friendly message suitable for display in a toast notification
 */
export function getOAuthBindErrorMessage(code: string): string {
  const key = OAUTH_BIND_ERROR_MESSAGES[code]
  if (!key) {
    // Dev breadcrumb: surfaces unmapped codes so future-proofing the mapping
    // table is auditable. The user-facing fallback message is preserved —
    // this console.warn never leaks to the UI.
    if (typeof console !== 'undefined') {
      console.warn(`[oauth-bind] unmapped error code: ${code}`)
    }
    return i18n.global.t('oauth.bind.fallback')
  }
  return i18n.global.t(key)
}

/**
 * Resolves the user-friendly message for an OAuth UNBIND error code.
 * Returns a default fallback message for unknown / missing codes.
 *
 * @param code - Backend error code (e.g. "AUTH_017", "AUTH_018") from the
 *               UNBIND failure response body
 * @returns User-friendly message suitable for display in a toast notification
 */
export function getOAuthUnbindErrorMessage(code: string): string {
  const key = OAUTH_UNBIND_ERROR_MESSAGES[code]
  if (!key) {
    if (typeof console !== 'undefined') {
      console.warn(`[oauth-unbind] unmapped error code: ${code}`)
    }
    return i18n.global.t('oauth.unbind.fallback')
  }
  return i18n.global.t(key)
}
