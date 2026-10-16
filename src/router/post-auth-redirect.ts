import type { Router } from 'vue-router'

/**
 * Resolves where a freshly authenticated session should land.
 *
 * The `redirect` query parameter exists so a visitor bounced off a protected
 * page returns to it — the router guard only ever sets it for `requiresAuth`
 * routes. A value pointing anywhere else (the marketing root, an auth page)
 * would strand the new session on a public page, so it is treated as absent
 * and the caller falls back to the dashboard. Absolute and protocol-relative
 * URLs are refused as well (open-redirect protection).
 *
 * @param router - The app router, used to read the target route's meta
 * @param raw - The untrusted redirect value from the URL or session storage
 * @returns The path to honour, or undefined when the caller should use its default
 */
export function resolvePostAuthTarget(router: Router, raw: unknown): string | undefined {
  if (typeof raw !== 'string' || !raw.startsWith('/') || raw.startsWith('//')) return undefined
  return router.resolve(raw).meta.requiresAuth ? raw : undefined
}
