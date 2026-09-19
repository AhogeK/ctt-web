import type { RouteRecordRaw } from 'vue-router'

import { RouteNames } from '../route-names'

// Nested under `AppLayout` like every other app page. Registered flat, the view
// rendered correctly but inside no shell at all — no sidebar, so no way to navigate
// away except the browser's back button. It is invisible in a screenshot because the
// page and its data look fine (the same bug shipped once for `/achievements`; see the
// achievements domain memory).

// `AppSidebar` carries a `/leaderboard` item, so the page is reachable in-app rather than by
// URL alone. It was deliberately absent while the feature was unbuilt — an entry pointing at a
// page that could only render its error state would be worse than none — and added once the
// contract was rebuilt against a real endpoint.

const leaderboardRoutes: RouteRecordRaw[] = [
  {
    path: '/leaderboard',
    name: RouteNames.LEADERBOARD,
    component: () => import('@/layouts/AppLayout.vue'),
    // Parent records must redirect to their default child: navigating to this
    // record by NAME resolves the parent alone, so the layout's inner
    // <router-view> has no matched child and the content region renders blank —
    // with no error and a correct URL. See the same note in dashboard.ts.
    redirect: { name: RouteNames.LEADERBOARD_GLOBAL },
    meta: { title: 'Leaderboard', requiresAuth: true, layout: 'app' },
    children: [
      {
        path: '',
        name: RouteNames.LEADERBOARD_GLOBAL,
        component: () => import('@/features/leaderboard/views/LeaderboardView.vue'),
        meta: { title: 'Leaderboard', requiresAuth: true },
      },
    ],
  },
]

export default leaderboardRoutes
