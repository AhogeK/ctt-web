/**
 * Shared time formatting utilities.
 *
 * Extracted from the ApiKeysView / DeviceListView inlines (v0.18.0) so every
 * view renders timestamps through a single implementation. No dayjs — the
 * project R12 dependency red line keeps relative/absolute formatting
 * dependency-free (existing formatter already covers all cases).
 */

/**
 * Render a timestamp as a relative time string.
 *
 * Handles both past (lastSeenAt, lastUsedAt) and future (expiresAt) dates:
 * - null → "Never"
 * - past → "Just now" / "Nm ago" / "Nh ago" / "Nd ago" / "Nmo ago" / locale date
 * - future → "Today" / "in Nd" / "in Nmo" / locale date
 *
 * @param dateStr - ISO-8601 timestamp, or null when the value is absent
 * @returns Human-readable relative time string
 */
export function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Never'

  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffMins = Math.floor(Math.abs(diffMs) / 60000)
  const diffHours = Math.floor(Math.abs(diffMs) / 3600000)
  const diffDays = Math.floor(Math.abs(diffMs) / 86400000)

  if (diffMs < 0) {
    // Past date — relative past
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 30) return `${diffDays}d ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
    return date.toLocaleDateString()
  }

  // Future date — relative future
  if (diffDays === 0) return 'Today'
  if (diffDays < 30) return `in ${diffDays}d`
  if (diffDays < 365) return `in ${Math.floor(diffDays / 30)}mo`
  return date.toLocaleDateString()
}

/**
 * Render a date string as a human-readable absolute datetime.
 *
 * Used as hover tooltips (e.g. `title` on relative-time spans) so users can
 * read the exact timestamp instead of a raw ISO string.
 *
 * @param dateStr - ISO-8601 timestamp
 * @returns Locale-formatted absolute datetime
 */
export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString()
}

/**
 * Format a duration in seconds as a compact human-readable string.
 *
 * Used by the dashboard overview cards:
 * - under a minute → "45s"
 * - under an hour → "45m"
 * - under a day → "2h 15m"
 * - a day or more → "2d 3h"
 *
 * @param totalSeconds - Duration in whole seconds (non-negative)
 * @returns Compact duration label
 */
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds}s`
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const parts: string[] = []
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (seconds > 0) parts.push(`${seconds}s`)
  return parts.join(' ')
}
