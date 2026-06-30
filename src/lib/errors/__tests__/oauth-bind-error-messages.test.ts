import { describe, it, expect } from 'vite-plus/test'
import {
  getOAuthBindErrorMessage,
  getOAuthUnbindErrorMessage,
  OAUTH_BIND_ERROR_MESSAGES,
  OAUTH_UNBIND_ERROR_MESSAGES,
} from '../oauth-bind-error-messages'

describe('getOAuthBindErrorMessage', () => {
  it.each([
    ['AUTH_006', 'Your account is not active. Please verify your email.'],
    ['AUTH_013', 'Authorization request expired. Please try again.'],
    ['AUTH_016', 'This GitHub account is already linked to another user.'],
    ['USER_004', 'User not found.'],
    ['OAUTH_PROVIDER_ERROR', 'GitHub authorization failed.'],
    ['OAUTH_INTERNAL_ERROR', 'Service error. Please try again later.'],
    ['MISSING_OAUTH_PARAMS', 'Invalid authorization response.'],
    ['INVALID_STATE_ACTION', 'Authorization request invalid.'],
  ])('returns mapped message for %s', (code, expected) => {
    expect(getOAuthBindErrorMessage(code)).toBe(expected)
  })

  it('returns fallback message for unknown error code', () => {
    expect(getOAuthBindErrorMessage('UNKNOWN_FUTURE_CODE')).toBe('Failed to connect GitHub. Please try again.')
  })

  it('returns fallback message for empty error code', () => {
    expect(getOAuthBindErrorMessage('')).toBe('Failed to connect GitHub. Please try again.')
  })

  it('exposes OAUTH_BIND_ERROR_MESSAGES record for external consumers', () => {
    expect(Object.keys(OAUTH_BIND_ERROR_MESSAGES)).toEqual(
      expect.arrayContaining([
        'AUTH_006',
        'AUTH_013',
        'AUTH_016',
        'USER_004',
        'OAUTH_PROVIDER_ERROR',
        'OAUTH_INTERNAL_ERROR',
        'MISSING_OAUTH_PARAMS',
        'INVALID_STATE_ACTION',
      ]),
    )
  })
})

describe('getOAuthUnbindErrorMessage', () => {
  it.each([
    ['COMMON_001', 'OAuth provider not supported.'],
    ['AUTH_017', 'This GitHub account is not linked to your account.'],
    ['AUTH_018', 'Cannot unlink the last login method. Please set a password first.'],
  ])('returns mapped message for %s', (code, expected) => {
    expect(getOAuthUnbindErrorMessage(code)).toBe(expected)
  })

  it('returns fallback message for unknown error code', () => {
    expect(getOAuthUnbindErrorMessage('UNKNOWN_FUTURE_CODE')).toBe('Failed to disconnect GitHub. Please try again.')
  })

  it('returns fallback message for empty error code', () => {
    expect(getOAuthUnbindErrorMessage('')).toBe('Failed to disconnect GitHub. Please try again.')
  })

  it('exposes OAUTH_UNBIND_ERROR_MESSAGES record for external consumers', () => {
    expect(Object.keys(OAUTH_UNBIND_ERROR_MESSAGES)).toEqual(
      expect.arrayContaining(['COMMON_001', 'AUTH_017', 'AUTH_018']),
    )
  })
})
