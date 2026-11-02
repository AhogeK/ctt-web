import { describe, expect, it } from 'vitest'
import type { RouteRecordRaw } from 'vue-router'
import { RouteNames } from '@/router/route-names'

// The router builds its table from these modules, so the test reads the same source it does.
const modules = import.meta.glob('../modules/*.ts', { eager: true }) as Record<string, { default: RouteRecordRaw[] }>

type Rec = RouteRecordRaw & { redirect?: unknown; children?: Rec[] }

const flat: { file: string; route: Rec }[] = []
for (const [file, mod] of Object.entries(modules)) {
  const walk = (routes: Rec[]) => {
    for (const r of routes) {
      flat.push({ file, route: r })
      if (r.children?.length) walk(r.children)
    }
  }
  walk(mod.default ?? [])
}

describe('route table invariants', () => {
  it('every route that has children declares a redirect to its default child', () => {
    const offenders = flat
      .filter(({ route }) => route.children?.length && route.redirect === undefined)
      .map(({ file, route }) => `${file}: ${String(route.path)}`)
    expect(offenders).toEqual([])
  })

  it('renders the OAuth steps inside the same shell as the sign-in pages', async () => {
    // The provider returns the reader to `/oauth/callback`, so that URL is fixed; the shell around
    // it has to be the one the sign-in pages use, or a screen-sized view here replaces the whole
    // card instead of just the panel.
    const shell = flat.find(({ route }) => route.path === '/oauth')
    const signIn = flat.find(({ route }) => route.path === '/auth')
    expect(shell, '/oauth must exist as the shell around the OAuth steps').toBeDefined()
    expect(signIn, '/auth must exist as the shell around the sign-in pages').toBeDefined()

    const children = shell!.route.children ?? []
    expect(children.map((child) => child.name)).toEqual(
      expect.arrayContaining([RouteNames.OAUTH_CALLBACK, RouteNames.OAUTH_ERROR]),
    )

    // The callback's own path stays where the provider sends it: `/oauth/callback`.
    const callback = children.find((child) => child.name === RouteNames.OAUTH_CALLBACK)
    expect(`${shell!.route.path}/${callback!.path}`).toBe('/oauth/callback')

    // Both parents mount the same layout component, not merely *a* parent with children.
    const load = (record: Rec) => (record.component as () => Promise<{ default: unknown }>)()
    const [oauthShell, signInShell] = await Promise.all([load(shell!.route), load(signIn!.route)])
    expect(oauthShell.default).toBe(signInShell.default)
  })

  it('bare /auth lands on the login page instead of rendering an empty form panel', () => {
    const auth = flat.find(({ route }) => route.path === '/auth')
    expect(auth, '/auth route must exist').toBeDefined()
    expect(auth!.route.redirect).toEqual({ name: RouteNames.LOGIN })
  })
})
