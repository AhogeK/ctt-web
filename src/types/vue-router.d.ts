import 'vue-router'
import type { RouteName } from '@/router/route-names'

declare module 'vue-router' {
  interface RouteMeta {
    /** Page title displayed in browser tab and navigation */
    title: string
    /** Whether authentication is required to access this route */
    requiresAuth?: boolean
    /** Whether this route is only accessible by unauthenticated users (guests) */
    guestOnly?: boolean
    /** RBAC role permissions required to access this route */
    roles?: string[]
    /** Layout template to use for this route */
    layout?: 'auth' | 'app'
    /** Whether to hide this route from sidebar navigation */
    hideInMenu?: boolean
    /** Type-safe route name for meta configuration */
    name?: RouteName
  }
}
