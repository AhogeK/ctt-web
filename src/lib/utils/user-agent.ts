/**
 * The browsers and operating systems a session's user agent string can name.
 *
 * The values are keys, not sentences: the interface renders them, so a sentence here would be
 * English in every locale.
 */
export type UserAgentBrowser = 'chrome' | 'edge' | 'firefox' | 'safari'
export type UserAgentSystem = 'macos' | 'windows' | 'linux' | 'ios' | 'android'

export interface UserAgentDescription {
  /** The browser, or null when the agent string names none that are known here. */
  browser: UserAgentBrowser | null
  /** The operating system, or null when the agent string names none that are known here. */
  system: UserAgentSystem | null
  /** The agent string as it arrived, truncated — the fallback when nothing is recognised. */
  raw: string
}

/** How much of an unrecognised agent string is kept. */
const RAW_MAX_LENGTH = 60

/**
 * Reads the browser and the system out of a user agent string.
 *
 * The order of the checks matters: Edge and every Chromium browser also say "Chrome", Chrome says
 * "Safari", Android says "Linux", and iOS says "like Mac OS X" — so the more specific marker is
 * looked for first, and the one that would be swallowed by a broader rule is checked before it.
 *
 * @param userAgent - the agent string as the client sent it, or null
 * @returns what could be read out of it, with the raw string as the fallback
 */
export function parseUserAgent(userAgent: string | null): UserAgentDescription {
  // A session created before the client sent an agent string has none; an empty string is the
  // same case.
  if (!userAgent) {
    return { browser: null, system: null, raw: '' }
  }

  return {
    browser: readBrowser(userAgent),
    system: readSystem(userAgent),
    raw: userAgent.length > RAW_MAX_LENGTH ? userAgent.slice(0, RAW_MAX_LENGTH) : userAgent,
  }
}

function readBrowser(agent: string): UserAgentBrowser | null {
  if (agent.includes('Edg/')) return 'edge'
  if (agent.includes('Chrome/')) return 'chrome'
  if (agent.includes('Firefox/')) return 'firefox'
  if (agent.includes('Safari/')) return 'safari'
  return null
}

function readSystem(agent: string): UserAgentSystem | null {
  if (agent.includes('Windows')) return 'windows'
  if (agent.includes('Android')) return 'android'
  if (/iPhone|iPad|iPod/.test(agent)) return 'ios'
  if (agent.includes('Mac OS X') || agent.includes('Macintosh')) return 'macos'
  if (agent.includes('Linux') || agent.includes('X11')) return 'linux'
  return null
}
