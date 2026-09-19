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

  it('bare /auth lands on the login page instead of rendering an empty form panel', () => {
    const auth = flat.find(({ route }) => route.path === '/auth')
    expect(auth, '/auth route must exist').toBeDefined()
    expect(auth!.route.redirect).toEqual({ name: RouteNames.LOGIN })
  })
})
