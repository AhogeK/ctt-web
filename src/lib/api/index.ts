export { apiFetch, type ApiFetchOptions } from './instance'
export {
  login,
  loginWithTwoFactorCode,
  logout,
  logoutAll,
  forgotPassword,
  confirmPasswordReset,
  acceptTerms,
  getGitHubAuthorizeUrl,
  type LoginResult,
} from './auth'
export { getPublicConfig, type PublicConfig } from './config'
export {
  fetchTwoFactorStatus,
  startTotpSetup,
  confirmTotpSetup,
  disableTwoFactor,
  regenerateRecoveryCodes,
} from './two-factor'
export type { TwoFactorStatus, StartTotpSetupResponse } from '@/lib/schemas/two-factor.schema'
export { fetchLinkedOAuthAccounts, unbindOAuthAccount } from './oauth-account'
export type { OAuthAccountsResponseData } from './oauth-account'
export {
  fetchCurrentUser,
  updateDisplayName,
  fetchLoginSessions,
  revokeLoginSession,
  revokeLoginSessions,
  downloadUserExport,
  type BatchRevokeSessionsResult,
  type LoginSession,
  type UserProfile,
} from './user'
