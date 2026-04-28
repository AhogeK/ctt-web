/**
 * Tests for API error handling utilities.
 *
 * Verifies that error codes are properly extracted from ofetch errors
 * and mapped to user-friendly messages.
 */
import { describe, it, expect } from 'vite-plus/test'
import { isApiError, mapApiErrorCode, getErrorMessage } from '../api-error'

describe('api-error', () => {
  describe('isApiError', () => {
    it('returns true for objects with statusCode number', () => {
      const error = { statusCode: 503, data: { code: 'LEADERBOARD_001' } }
      expect(isApiError(error)).toBe(true)
    })

    it('returns false for objects without statusCode', () => {
      const error = { message: 'Something went wrong' }
      expect(isApiError(error)).toBe(false)
    })

    it('returns false for non-objects', () => {
      expect(isApiError(null)).toBe(false)
      expect(isApiError(undefined)).toBe(false)
      expect(isApiError('string')).toBe(false)
      expect(isApiError(42)).toBe(false)
    })
  })

  describe('mapApiErrorCode', () => {
    it('maps LEADERBOARD_001 to user-friendly message', () => {
      const message = mapApiErrorCode('LEADERBOARD_001')
      expect(message).toBe('The leaderboard is currently unavailable. Please try again later.')
    })

    it('maps LEADERBOARD_002 to user-friendly message', () => {
      const message = mapApiErrorCode('LEADERBOARD_002')
      expect(message).toBe('You are not ranked on the leaderboard yet. Start tracking your coding time to appear.')
    })

    it('returns the code itself for unmapped codes', () => {
      const message = mapApiErrorCode('UNKNOWN_CODE')
      expect(message).toBe('UNKNOWN_CODE')
    })

    it('maps auth error codes correctly', () => {
      expect(mapApiErrorCode('AUTH_001')).toBe('Invalid email or password. Please check your credentials.')
      expect(mapApiErrorCode('AUTH_006')).toBe('Please verify your email before signing in.')
    })
  })

  describe('getErrorMessage', () => {
    it('extracts and maps LEADERBOARD_001 error code from ofetch API error', () => {
      const apiError = {
        statusCode: 503,
        statusMessage: 'Service Unavailable',
        message: 'Service Unavailable',
        data: {
          success: false,
          message: 'Leaderboard is not available',
          code: 'LEADERBOARD_001',
          timestamp: '2026-04-28T00:00:00Z',
        },
      }

      const result = getErrorMessage(apiError)
      expect(result).toBe('The leaderboard is currently unavailable. Please try again later.')
    })

    it('extracts and maps LEADERBOARD_002 error code from ofetch API error', () => {
      const apiError = {
        statusCode: 404,
        statusMessage: 'Not Found',
        message: 'Not Found',
        data: {
          success: false,
          message: 'User not found in leaderboard',
          code: 'LEADERBOARD_002',
          timestamp: '2026-04-28T00:00:00Z',
        },
      }

      const result = getErrorMessage(apiError)
      expect(result).toBe('You are not ranked on the leaderboard yet. Start tracking your coding time to appear.')
    })

    it('falls back to data.message when no error code present', () => {
      const apiError = {
        statusCode: 500,
        statusMessage: 'Internal Server Error',
        message: 'Internal Server Error',
        data: {
          success: false,
          message: 'Something went wrong',
          timestamp: '2026-04-28T00:00:00Z',
        },
      }

      const result = getErrorMessage(apiError)
      expect(result).toBe('Something went wrong')
    })

    it('falls back to generic message when no data present', () => {
      const apiError = {
        statusCode: 500,
        statusMessage: 'Internal Server Error',
        message: 'Internal Server Error',
      }

      const result = getErrorMessage(apiError)
      expect(result).toBe('An unexpected error occurred. Please try again later.')
    })

    it('handles Error instances', () => {
      const error = new Error('Network error')
      expect(getErrorMessage(error)).toBe('Network error')
    })

    it('handles string errors', () => {
      expect(getErrorMessage('Something failed')).toBe('Something failed')
    })

    it('handles unknown errors with fallback message', () => {
      expect(getErrorMessage(null)).toBe('An unexpected error occurred. Please try again later.')
      expect(getErrorMessage(undefined)).toBe('An unexpected error occurred. Please try again later.')
      expect(getErrorMessage({})).toBe('An unexpected error occurred. Please try again later.')
    })
  })
})
