/**
 * Avatar utilities — hash-based deterministic color + initials extraction
 *
 * Used to render "fake avatars" (circle with first letter/initials on a
 * hash-derived background color) for the user in the top-right header.
 *
 * Pattern follows common console-product UI conventions (GitHub, Linear, Vercel):
 *   - hash(userId) → HSL hue → background color (same user → same color)
 *   - extract first letter / initials from display name → foreground text
 *
 * Both deterministic: same user always renders the same avatar.
 */

/**
 * Hash a string to an integer in the HSL hue range [0, 360).
 *
 * Algorithm: djb2 variant — hash = hash * 31 + charCode.
 * - O(n) where n is the input length
 * - No external dependencies
 * - Bitwise & 0 keeps the value a 32-bit integer (avoids float drift in long inputs)
 *
 * @param str - Input to hash (typically userId or displayName)
 * @returns Integer in [0, 360) suitable for HSL hue
 */
export function stringToHue(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0 // force 32-bit integer
  }
  return Math.abs(hash) % 360
}

/**
 * Convert a string to a deterministic HSL background color.
 *
 * - Fixed S=65%, L=45% — saturated, slightly darker for white text contrast
 * - Only H varies per input → same user always gets same color
 *
 * @param str - Input to hash (typically userId)
 * @returns CSS hsl() string, e.g. "hsl(127, 65%, 45%)"
 */
export function stringToAvatarColor(str: string): string {
  const hue = stringToHue(str)
  return `hsl(${hue}, 65%, 45%)`
}

/**
 * Extract initials (1-2 uppercase letters) from a user display name.
 *
 * Edge cases:
 * - empty / whitespace-only → "?"
 * - email "alice@example.com" → "A" (uses part before @)
 * - "Alice Bob" → "AB" (first letter of first and last word)
 * - "alice_bob" / "alice-bob" → "AB" (split on _ or -)
 * - single word "alice" → "A"
 * - non-Latin (e.g. "张三") → "张" (first character, regardless of width)
 *
 * @param name - Display name or email
 * @returns 1-2 character uppercase string
 */
export function getInitials(name: string): string {
  if (!name || !name.trim()) return '?'

  // Email: use the part before @
  const cleaned = name.includes('@') ? name.split('@')[0]! : name

  // Split on whitespace, underscore, or hyphen
  const parts = cleaned
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
  if (parts.length === 0) return '?'

  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase()

  // First letter of first + first letter of last word
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase()
}
