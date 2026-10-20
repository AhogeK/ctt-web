import type { RouteRecordRaw } from 'vue-router'

import { RouteNames } from '../route-names'

/**
 * Legacy URL: device management moved under the settings group
 * (`/settings/devices`). The old path stays reachable for bookmarks, links in
 * older docs and the E2E helpers, and MUST keep working — it redirects to the
 * new location instead of 404-ing or rendering a second copy of the page.
 */
const devicesRoutes: RouteRecordRaw[] = [
  {
    path: '/devices',
    redirect: { name: RouteNames.SETTINGS_DEVICES },
  },
]

export default devicesRoutes
