import type { HTMLAttributes } from 'vue'

/**
 * Sidebar component props.
 *
 * Defined in a standalone module (not the index barrel) so the SFC compiler
 * can resolve it without a circular import: Sidebar.vue imports this type,
 * and index.ts re-exports both — importing from '.' would create
 * Sidebar.vue → index.ts → Sidebar.vue and break Rolldown's
 * defineProps type extraction (silently dropping the props declaration).
 */
export interface SidebarProps {
  side?: 'left' | 'right'
  variant?: 'sidebar' | 'floating' | 'inset'
  collapsible?: 'offcanvas' | 'icon' | 'none'
  class?: HTMLAttributes['class']
}
