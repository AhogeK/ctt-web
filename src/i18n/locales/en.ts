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
      confirmPassword: 'Confirm Password',
      captchaRequired: 'Please complete the captcha verification',
      or: 'or',
      close: 'Close',
      backToSignIn: 'Back to sign in',
      tryAgain: 'Try again',
    },
    validation: {
      invalidEmail: 'Invalid email format',
      emailRequired: 'Email is required',
      passwordRequired: 'Password is required',
      passwordInvalidChars: 'Password contains invalid characters',
      passwordMinLength: 'Password must be at least 8 characters',
      passwordMaxLength: 'Password must not exceed 64 characters',
      displayNameRequired: 'Display name is required',
      displayNameInvalid: 'Invalid display name format',
      confirmPasswordRequired: 'Please confirm your password',
      passwordMismatch: 'Passwords do not match',
      termsRequired: 'You must agree to the Terms of Service',
    },
    login: {
      signIn: 'Sign in',
      signingIn: 'Signing in...',
      forgotPassword: 'Forgot password?',
      continueWithGithub: 'Continue with GitHub',
      connectingToGithub: 'Connecting to GitHub...',
    },
    register: {
      displayName: 'Display Name',
      displayNamePlaceholder: 'Your name',
      passwordPlaceholder: 'Create a strong password',
      confirmPasswordPlaceholder: 'Repeat your password',
      termsPrefix: 'I agree to the',
      createAccount: 'Create account',
    },
    forgot: {
      sendResetLink: 'Send reset link',
      sending: 'Sending...',
    },
    reset: {
      newPassword: 'New Password',
      newPasswordPlaceholder: 'Enter new password',
      confirmPasswordPlaceholder: 'Confirm new password',
      resetPassword: 'Reset password',
      resetting: 'Resetting...',
      subtitle: 'Enter your new password below.',
      invalidLinkTitle: 'Invalid Reset Link',
      invalidLinkHint: 'This password reset link is invalid or has expired. Please request a new one.',
      requestNewLink: 'Request New Reset Link',
      success: 'Password reset successful. All devices have been logged out.',
      failed: 'Password reset failed. Please try again later.',
      tooMany: 'Too many requests',
      retryIn: 'Try again in {seconds}s',
    },
    strength: {
      lengthRequired: '8+ characters required',
      lengthStrong: '16+ characters (strong)',
      lengthMedium: '12-15 characters (medium)',
      lengthBasic: '8-11 characters (basic)',
      uppercase: 'Contains uppercase letter',
      lowercase: 'Contains lowercase letter',
      number: 'Contains a number',
      special: 'Contains special character',
      score: 'Strength: {score}/7',
    },
    terms: {
      title: 'Terms of Service',
      lastUpdated: 'Last updated: {date} · Version {version}',
      decline: 'Decline',
      accept: 'Accept',
      accepting: 'Accepting...',
      accepted: 'Terms accepted successfully',
      acceptFailed: 'Failed to accept terms. Please try again.',
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
