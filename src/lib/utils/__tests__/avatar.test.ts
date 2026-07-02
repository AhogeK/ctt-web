/**
 * Tests for avatar utilities.
 *
 * Verifies deterministic hash-based color generation and initials
 * extraction from various name formats (single word, multi-word,
 * email, separators, non-Latin).
 */
import { describe, it, expect } from 'vite-plus/test'
import { stringToHue, stringToAvatarColor, getInitials } from '@/lib/utils/avatar'

describe('avatar utilities', () => {
  describe('stringToHue', () => {
    it('returns a value in [0, 360) for any input', () => {
      for (const s of ['', 'a', 'alice', 'long-string-with-various-chars-12345', '🎉', '张三']) {
        const h = stringToHue(s)
        expect(h).toBeGreaterThanOrEqual(0)
        expect(h).toBeLessThan(360)
        expect(Number.isInteger(h)).toBe(true)
      }
    })

    it('is deterministic (same input → same output)', () => {
      expect(stringToHue('alice')).toBe(stringToHue('alice'))
      expect(stringToHue('user-uuid-1234')).toBe(stringToHue('user-uuid-1234'))
    })

    it('produces different hues for different inputs (probabilistic)', () => {
      const a = stringToHue('alice')
      const b = stringToHue('bob')
      const c = stringToHue('charlie')
      // Not strictly required to differ (hash collisions exist), but check at least
      // 2 out of 3 are different.
      const unique = new Set([a, b, c]).size
      expect(unique).toBeGreaterThan(1)
    })
  })

  describe('stringToAvatarColor', () => {
    it('returns a valid hsl() CSS string', () => {
      const color = stringToAvatarColor('alice')
      expect(color).toMatch(/^hsl\(\d+, 65%, 45%\)$/)
    })

    it('is deterministic', () => {
      expect(stringToAvatarColor('alice')).toBe(stringToAvatarColor('alice'))
    })

    it('produces different colors for different inputs', () => {
      expect(stringToAvatarColor('alice')).not.toBe(stringToAvatarColor('bob'))
    })
  })

  describe('getInitials', () => {
    it('returns ? for empty or whitespace input', () => {
      expect(getInitials('')).toBe('?')
      expect(getInitials('   ')).toBe('?')
    })

    it('returns first letter uppercase for single word', () => {
      expect(getInitials('alice')).toBe('A')
      expect(getInitials('Bob')).toBe('B')
    })

    it('returns first letter of first and last word for multi-word', () => {
      expect(getInitials('Alice Bob')).toBe('AB')
      expect(getInitials('alice bob charlie')).toBe('AC') // first + last
    })

    it('handles email addresses (uses part before @)', () => {
      expect(getInitials('alice@example.com')).toBe('A')
      expect(getInitials('john.doe@corp.io')).toBe('J')
    })

    it('handles underscore and hyphen separators', () => {
      expect(getInitials('alice_bob')).toBe('AB')
      expect(getInitials('alice-bob')).toBe('AB')
    })

    it('handles non-Latin (Chinese, etc.) first char', () => {
      expect(getInitials('张三')).toBe('张')
    })
  })
})
