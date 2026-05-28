/**
 * Route name constants.
 * Use these instead of magic strings for type safety and maintainability.
 */
export const RouteNames = {
  // Root & Exception
  HOME: 'home',
  HOME_INDEX: 'home-index',
  NOT_FOUND: 'not-found',

  // Auth
  AUTH_LAYOUT: 'auth-layout',
  LOGIN: 'login',
  REGISTER: 'register',
  REGISTER_SUCCESS: 'register-success',
  VERIFY_EMAIL: 'verify-email',
  FORGOT_PASSWORD: 'forgot-password',
  RESET_PASSWORD: 'reset-password',
  OAUTH_CALLBACK: 'oauth-callback',
  OAUTH_ERROR: 'oauth-error',

  // Dashboard
  DASHBOARD: 'dashboard',
  DASHBOARD_HOME: 'dashboard-home',

  // Devices
  DEVICES: 'devices',
  DEVICES_LIST: 'devices-list',

  // Settings
  SETTINGS: 'settings',
  SETTINGS_PROFILE: 'settings-profile',
  SETTINGS_API_KEYS: 'settings-api-keys',
  SETTINGS_DEVICES: 'settings-devices',

  // Leaderboard
  LEADERBOARD: 'leaderboard',
} as const

/**
 * Route name type derived from constants.
 * Ensures type safety when referencing route names.
 */
export type RouteName = (typeof RouteNames)[keyof typeof RouteNames]
