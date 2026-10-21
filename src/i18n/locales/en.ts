/**
 * English messages — the source language.
 *
 * Keys are grouped by surface (`nav`, `header`, `theme`, `settings`) so one
 * migration batch maps to one namespace. Every key must exist in `zh-CN.ts`
 * with the same path: the structural type below and the message-parity test
 * both fail when the two catalogues drift apart.
 */
const en = {
  nav: {
    groupNavigation: 'Navigation',
    groupSettings: 'Settings',
    dashboard: 'Dashboard',
    achievements: 'Achievements',
    leaderboard: 'Leaderboard',
    settings: 'Settings',
  },
  header: {
    openUserMenu: 'Open user menu',
    appearance: 'Appearance',
    language: 'Language',
    settings: 'Settings',
    logout: 'Logout',
    loggingOut: 'Logging out...',
    fallbackUser: 'User',
  },
  language: {
    english: 'English',
    chineseSimplified: '简体中文',
  },
  theme: {
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    systemDark: 'System (Dark)',
    systemLight: 'System (Light)',
  },
  auth: {
    common: {
      email: 'Email',
      emailPlaceholder: "you{'@'}example.com",
      password: 'Password',
      passwordPlaceholder: 'Enter your password',
      captchaRequired: 'Please complete the captcha verification',
      or: 'or',
      close: 'Close',
      backToSignIn: 'Back to sign in',
      tryAgain: 'Try again',
    },
    validation: {
      invalidEmail: 'Invalid email format',
      emailRequired: 'Email is required',
    },
    login: {
      signIn: 'Sign in',
      signingIn: 'Signing in...',
      forgotPassword: 'Forgot password?',
      continueWithGithub: 'Continue with GitHub',
      connectingToGithub: 'Connecting to GitHub...',
    },
  },
  settings: {
    sections: {
      navLabel: 'Settings sections',
      profile: 'Profile',
      profileDescription: 'Account, email and sign-in methods',
      devices: 'Devices',
      devicesDescription: 'Machines syncing your coding time',
      preferences: 'Preferences',
      preferencesDescription: 'Appearance and language',
      apiKeys: 'API Keys',
      apiKeysDescription: 'Credentials for the plugin and API',
    },
    preferences: {
      title: 'Preferences',
      subtitle: 'Appearance and behaviour that apply to this browser.',
      appearance: 'Appearance',
      current: 'Current: {value}',
      theme: 'Theme',
      language: 'Language',
      languageDescription: 'Interface language. Changes apply immediately.',
    },
  },
}

export type Messages = typeof en

export default en
