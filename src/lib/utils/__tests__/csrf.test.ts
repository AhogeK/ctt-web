/**
 * Tests for CSRF token utilities.
 *
 * Verifies the Double Submit Cookie pattern implementation:
 * - Reading XSRF-TOKEN cookie
 * - Injecting X-XSRF-TOKEN header for state-changing requests
 * - Skipping header for safe methods (GET, HEAD, OPTIONS)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vite-plus/test'
import { getCsrfToken, injectCsrfHeader } from '@/lib/utils/csrf'

describe('csrf', () => {
  // ---------------------------------------------------------------------------
  // getCsrfToken
  // ---------------------------------------------------------------------------
  describe('getCsrfToken', () => {
    let cookieSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      cookieSpy = vi.spyOn(document, 'cookie', 'get')
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('returns token from XSRF-TOKEN cookie when present', () => {
      cookieSpy.mockReturnValue('XSRF-TOKEN=abc123')
      expect(getCsrfToken()).toBe('abc123')
    })

    it('returns null when XSRF-TOKEN cookie is absent', () => {
      cookieSpy.mockReturnValue('')
      expect(getCsrfToken()).toBeNull()
    })

    it('returns null when other cookies exist but not XSRF-TOKEN', () => {
      cookieSpy.mockReturnValue('session_id=xyz; other_cookie=value')
      expect(getCsrfToken()).toBeNull()
    })

    it('handles cookie with special characters in token', () => {
      cookieSpy.mockReturnValue('XSRF-TOKEN=abc+def/ghi==')
      expect(getCsrfToken()).toBe('abc+def/ghi==')
    })

    it('handles multiple cookies and extracts XSRF-TOKEN correctly', () => {
      cookieSpy.mockReturnValue('session_id=xyz; XSRF-TOKEN=token123; theme=dark')
      expect(getCsrfToken()).toBe('token123')
    })

    it('returns empty string for empty cookie value', () => {
      cookieSpy.mockReturnValue('XSRF-TOKEN=')
      expect(getCsrfToken()).toBe('')
    })

    it('returns null when cookie string is only whitespace', () => {
      cookieSpy.mockReturnValue('   ')
      expect(getCsrfToken()).toBeNull()
    })
  })

  // ---------------------------------------------------------------------------
  // injectCsrfHeader
  // ---------------------------------------------------------------------------
  describe('injectCsrfHeader', () => {
    let cookieSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      cookieSpy = vi.spyOn(document, 'cookie', 'get')
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('adds X-XSRF-TOKEN header for POST requests', () => {
      cookieSpy.mockReturnValue('XSRF-TOKEN=test-token')
      const headers = new Headers()

      injectCsrfHeader(headers, 'POST')

      expect(headers.get('X-XSRF-TOKEN')).toBe('test-token')
    })

    it('adds X-XSRF-TOKEN header for PUT requests', () => {
      cookieSpy.mockReturnValue('XSRF-TOKEN=test-token')
      const headers = new Headers()

      injectCsrfHeader(headers, 'PUT')

      expect(headers.get('X-XSRF-TOKEN')).toBe('test-token')
    })

    it('adds X-XSRF-TOKEN header for DELETE requests', () => {
      cookieSpy.mockReturnValue('XSRF-TOKEN=test-token')
      const headers = new Headers()

      injectCsrfHeader(headers, 'DELETE')

      expect(headers.get('X-XSRF-TOKEN')).toBe('test-token')
    })

    it('adds X-XSRF-TOKEN header for PATCH requests', () => {
      cookieSpy.mockReturnValue('XSRF-TOKEN=test-token')
      const headers = new Headers()

      injectCsrfHeader(headers, 'PATCH')

      expect(headers.get('X-XSRF-TOKEN')).toBe('test-token')
    })

    it('skips header for GET requests', () => {
      cookieSpy.mockReturnValue('XSRF-TOKEN=test-token')
      const headers = new Headers()

      injectCsrfHeader(headers, 'GET')

      expect(headers.has('X-XSRF-TOKEN')).toBe(false)
    })

    it('skips header for HEAD requests', () => {
      cookieSpy.mockReturnValue('XSRF-TOKEN=test-token')
      const headers = new Headers()

      injectCsrfHeader(headers, 'HEAD')

      expect(headers.has('X-XSRF-TOKEN')).toBe(false)
    })

    it('skips header for OPTIONS requests', () => {
      cookieSpy.mockReturnValue('XSRF-TOKEN=test-token')
      const headers = new Headers()

      injectCsrfHeader(headers, 'OPTIONS')

      expect(headers.has('X-XSRF-TOKEN')).toBe(false)
    })

    it('handles lowercase method names by converting to uppercase', () => {
      cookieSpy.mockReturnValue('XSRF-TOKEN=test-token')
      const headers = new Headers()

      injectCsrfHeader(headers, 'post')

      expect(headers.get('X-XSRF-TOKEN')).toBe('test-token')
    })

    it('does not set header when no CSRF token cookie exists', () => {
      cookieSpy.mockReturnValue('')
      const headers = new Headers()

      injectCsrfHeader(headers, 'POST')

      expect(headers.has('X-XSRF-TOKEN')).toBe(false)
    })

    it('preserves existing headers when injecting CSRF token', () => {
      cookieSpy.mockReturnValue('XSRF-TOKEN=test-token')
      const headers = new Headers()
      headers.set('Content-Type', 'application/json')
      headers.set('Authorization', 'Bearer jwt-token')

      injectCsrfHeader(headers, 'POST')

      expect(headers.get('X-XSRF-TOKEN')).toBe('test-token')
      expect(headers.get('Content-Type')).toBe('application/json')
      expect(headers.get('Authorization')).toBe('Bearer jwt-token')
    })

    it('overwrites existing X-XSRF-TOKEN header if already present', () => {
      cookieSpy.mockReturnValue('XSRF-TOKEN=new-token')
      const headers = new Headers()
      headers.set('X-XSRF-TOKEN', 'old-token')

      injectCsrfHeader(headers, 'POST')

      expect(headers.get('X-XSRF-TOKEN')).toBe('new-token')
    })

    it('skips header when method is empty string', () => {
      cookieSpy.mockReturnValue('XSRF-TOKEN=test-token')
      const headers = new Headers()

      injectCsrfHeader(headers, '')

      expect(headers.has('X-XSRF-TOKEN')).toBe(false)
    })
  })
})
