/**
 * CSRF token utilities for Double Submit Cookie pattern.
 *
 * ctt-server uses Spring Security's {@link CookieCsrfTokenRepository} with
 * `httpOnly=false`, which sets an `XSRF-TOKEN` cookie on every response.
 * The frontend must read this cookie and echo it back as the `X-XSRF-TOKEN`
 * header on every state-changing request (POST, PUT, DELETE, PATCH).
 *
 * Public endpoints (login, register, etc.) are exempt server-side via
 * {@code csrf.ignoringRequestMatchers(publicApiUrls)} — sending the header
 * there is harmless but unnecessary.
 *
 * @see SecurityConfig#securityFilterChain for server-side CSRF configuration
 */

/** HTTP methods that mutate state and require a CSRF token. */
const CSRF_METHODS = new Set(['POST', 'PUT', 'DELETE', 'PATCH'])

/** Cookie name set by Spring's CookieCsrfTokenRepository (default). */
const CSRF_COOKIE_NAME = 'XSRF-TOKEN'

/** Header name expected by Spring's CsrfFilter (default). */
const CSRF_HEADER_NAME = 'X-XSRF-TOKEN'

/**
 * Reads the CSRF token from the `XSRF-TOKEN` cookie.
 *
 * Returns `null` when the cookie is absent — this is expected for:
 * - First-page loads before any API call
 * - Sessions where the server hasn't set the cookie yet
 *
 * @returns The CSRF token string, or `null` if not present
 */
export function getCsrfToken(): string | null {
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${CSRF_COOKIE_NAME}=`))

  if (!match) return null

  // Cookie format: "XSRF-TOKEN=<value>"
  return match.substring(CSRF_COOKIE_NAME.length + 1)
}

/**
 * Conditionally injects the `X-XSRF-TOKEN` header into a {@link Headers} object.
 *
 * Only injects for state-changing methods (POST, PUT, DELETE, PATCH).
 * Safe methods (GET, HEAD, OPTIONS) are left untouched per RFC 7231 —
 * CSRF protection is unnecessary for read-only requests.
 *
 * If no CSRF token cookie exists (e.g. before first API response sets it),
 * the header is silently skipped. The server will reject with CSRF_001 if
 * the token was actually required.
 *
 * @param headers - The mutable {@link Headers} object to augment
 * @param method  - The HTTP method of the request
 */
export function injectCsrfHeader(headers: Headers, method: string): void {
  const upperMethod = method.toUpperCase()

  if (!CSRF_METHODS.has(upperMethod)) return

  const token = getCsrfToken()
  if (token) {
    headers.set(CSRF_HEADER_NAME, token)
  }
}
