import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** Page title displayed in browser tab and navigation */
    title: string
    /** Whether authentication is required to access this route */
    requiresAuth?: boolean
    /** RBAC role permissions required to access this route */
    roles?: string[]
    /** Layout template to use for this route */
    layout?: 'default' | 'blank' | 'dashboard'
    /** Whether to hide this route from sidebar navigation */
    hideInMenu?: boolean
  }
}
