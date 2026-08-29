/**
 * Tests for API error handling utilities.
 *
 * Verifies that error codes are properly extracted from ofetch errors
 * and mapped to user-friendly messages.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vite-plus/test'
import { isApiError, mapApiErrorCode, getErrorMessage, getRetryAfterSeconds } from '@/lib/utils'

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

    it('maps DEVICE_001 to a friendly message', () => {
      expect(mapApiErrorCode('DEVICE_001')).toBe('Device already registered to another user.')
    })

    it('maps COMMON_002 as a not-found resource message (404)', () => {
      expect(mapApiErrorCode('COMMON_002')).toBe(
        'The requested resource was not found or you do not have access to it.',
      )
    })

    it('keeps RATE_LIMIT_001 as the rate-limit message', () => {
      expect(mapApiErrorCode('RATE_LIMIT_001')).toBe('Too many requests. Please wait a moment before trying again.')
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

  describe('getRetryAfterSeconds', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-08-07T12:00:00Z'))
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    function makeHeaderError(headerValue: string | null): unknown {
      return {
        statusCode: 429,
        response: {
          status: 429,
          headers: {
            get: (name: string) => (name.toLowerCase() === 'retry-after' ? headerValue : null),
          },
        },
      }
    }

    it('reads delta-seconds from the Retry-After header', () => {
      expect(getRetryAfterSeconds(makeHeaderError('60'))).toBe(60)
      expect(getRetryAfterSeconds(makeHeaderError('0'))).toBeNull()
      expect(getRetryAfterSeconds(makeHeaderError('  120  '))).toBe(120)
    })

    it('reads an HTTP-date from the Retry-After header', () => {
      // 90 seconds in the future -> ceil(90) = 90
      const future = new Date('2026-08-07T12:01:30Z').toUTCString()
      expect(getRetryAfterSeconds(makeHeaderError(future))).toBe(90)
    })

    it('returns null for a past HTTP-date header', () => {
      const past = new Date('2026-08-07T11:00:00Z').toUTCString()
      expect(getRetryAfterSeconds(makeHeaderError(past))).toBeNull()
    })

    it('reads a future retryAfter Instant from the error body', () => {
      const error = {
        statusCode: 429,
        data: { retryAfter: '2026-08-07T12:02:00Z' },
      }
      expect(getRetryAfterSeconds(error)).toBe(120)
    })

    it('returns null for a past retryAfter body Instant', () => {
      const error = {
        statusCode: 429,
        data: { retryAfter: '2026-08-07T11:00:00Z' },
      }
      expect(getRetryAfterSeconds(error)).toBeNull()
    })

    it('prefers the header over the body when both are present', () => {
      const error = {
        statusCode: 429,
        response: {
          headers: {
            get: (name: string) => (name.toLowerCase() === 'retry-after' ? '30' : null),
          },
        },
        data: { retryAfter: '2026-08-07T12:05:00Z' },
      }
      expect(getRetryAfterSeconds(error)).toBe(30)
    })

    it('falls back to the body when the header is absent', () => {
      const error = {
        statusCode: 429,
        response: { headers: { get: () => null } },
        data: { retryAfter: '2026-08-07T12:01:00Z' },
      }
      expect(getRetryAfterSeconds(error)).toBe(60)
    })

    it('returns null when neither source is present', () => {
      expect(getRetryAfterSeconds({ statusCode: 429, data: { code: 'RATE_LIMIT_001' } })).toBeNull()
      expect(getRetryAfterSeconds(makeHeaderError(null))).toBeNull()
      expect(getRetryAfterSeconds(makeHeaderError(''))).toBeNull()
    })

    it('returns null for malformed inputs', () => {
      expect(getRetryAfterSeconds(makeHeaderError('not-a-date'))).toBeNull()
      expect(getRetryAfterSeconds(makeHeaderError('-5'))).toBeNull()
      expect(getRetryAfterSeconds(makeHeaderError('1.5'))).toBeNull()
      expect(getRetryAfterSeconds({ data: { retryAfter: 'garbage' } })).toBeNull()
      expect(getRetryAfterSeconds({ data: { retryAfter: 123 } })).toBeNull()
    })

    it('never throws on unexpected shapes', () => {
      const throwingHeaders = {
        get: () => {
          throw new Error('boom')
        },
      }
      expect(getRetryAfterSeconds({ response: { headers: throwingHeaders } })).toBeNull()
      expect(getRetryAfterSeconds(null)).toBeNull()
      expect(getRetryAfterSeconds(undefined)).toBeNull()
      expect(getRetryAfterSeconds('string')).toBeNull()
      expect(getRetryAfterSeconds(42)).toBeNull()
      expect(getRetryAfterSeconds({})).toBeNull()
      expect(getRetryAfterSeconds({ response: {} })).toBeNull()
      expect(getRetryAfterSeconds({ response: { headers: {} } })).toBeNull()
      expect(getRetryAfterSeconds({ response: { headers: { get: 'not-a-fn' } } })).toBeNull()
    })
  })
})
