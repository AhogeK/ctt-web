/**
 * Tests for the shared time formatting utilities.
 *
 * Uses timestamps constructed relative to Date.now() so the assertions stay
 * deterministic without fake timers.
 */
import { describe, it, expect } from 'vite-plus/test'
import { formatRelativeTime, formatDateTime } from '@/lib/utils'

const minutesAgo = (m: number) => new Date(Date.now() - m * 60000).toISOString()
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600000).toISOString()
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString()
const daysFromNow = (d: number) => new Date(Date.now() + d * 86400000).toISOString()

describe('formatRelativeTime', () => {
  it('returns Never for null input', () => {
    expect(formatRelativeTime(null)).toBe('Never')
  })

  it('returns Just now for recent timestamps', () => {
    expect(formatRelativeTime(new Date(Date.now() - 1000).toISOString())).toBe('Just now')
    expect(formatRelativeTime(minutesAgo(0.5))).toBe('Just now')
  })

  it('formats past minutes', () => {
    expect(formatRelativeTime(minutesAgo(5))).toBe('5m ago')
    expect(formatRelativeTime(minutesAgo(59))).toBe('59m ago')
  })

  it('formats past hours', () => {
    expect(formatRelativeTime(hoursAgo(2))).toBe('2h ago')
    expect(formatRelativeTime(hoursAgo(23))).toBe('23h ago')
  })

  it('formats past days', () => {
    expect(formatRelativeTime(daysAgo(3))).toBe('3d ago')
    expect(formatRelativeTime(daysAgo(29))).toBe('29d ago')
  })

  it('formats past months', () => {
    expect(formatRelativeTime(daysAgo(45))).toBe('1mo ago')
    expect(formatRelativeTime(daysAgo(120))).toBe('4mo ago')
  })

  it('falls back to locale date for very old timestamps', () => {
    const old = daysAgo(400)
    expect(formatRelativeTime(old)).toBe(new Date(old).toLocaleDateString())
  })

  it('formats future dates within a day as Today', () => {
    const soon = new Date(Date.now() + 30 * 60000).toISOString()
    expect(formatRelativeTime(soon)).toBe('Today')
  })

  it('formats future days and months', () => {
    expect(formatRelativeTime(daysFromNow(5))).toBe('in 5d')
    expect(formatRelativeTime(daysFromNow(45))).toBe('in 1mo')
  })

  it('falls back to locale date for distant future dates', () => {
    const far = daysFromNow(400)
    expect(formatRelativeTime(far)).toBe(new Date(far).toLocaleDateString())
  })
})

describe('formatDateTime', () => {
  it('formats an ISO string to locale datetime', () => {
    const iso = '2026-08-29T12:00:00.000Z'
    expect(formatDateTime(iso)).toBe(new Date(iso).toLocaleString())
  })
})
