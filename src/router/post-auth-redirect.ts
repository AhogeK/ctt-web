import type { LocationQuery, Router } from 'vue-router'

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

/**
 * Reads the `redirect` query parameter in the shape a router navigation expects.
 *
 * Both sign-in steps pass the same destination along, and the value has to be forwarded as a
 * query object rather than as a bare string: an absent or empty value becomes `undefined` so the
 * navigation keeps a clean URL instead of carrying an empty parameter.
 *
 * @param query - the route's query object (`route.query`)
 * @returns `{ redirect }` when the value is a non-empty string, otherwise undefined
 */
export function redirectQueryOf(query: LocationQuery): Record<string, string> | undefined {
  const target = query.redirect
  return typeof target === 'string' && target.length > 0 ? { redirect: target } : undefined
}
