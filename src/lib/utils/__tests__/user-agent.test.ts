import { describe, it, expect } from 'vite-plus/test'
import { parseUserAgent } from '../user-agent'

const CHROME_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const EDGE_WINDOWS =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
const FIREFOX_LINUX = 'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0'
const SAFARI_IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1'
const ANDROID =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'

describe('parseUserAgent', () => {
  it('reads the browser and the system out of a desktop agent', () => {
    const parsed = parseUserAgent(CHROME_MAC)
    expect(parsed.browser).toBe('chrome')
    expect(parsed.system).toBe('macos')
  })

  it('prefers Edge over Chrome, which its agent string also contains', () => {
    const parsed = parseUserAgent(EDGE_WINDOWS)
    expect(parsed.browser).toBe('edge')
    expect(parsed.system).toBe('windows')
  })

  it('reads Firefox on Linux', () => {
    const parsed = parseUserAgent(FIREFOX_LINUX)
    expect(parsed.browser).toBe('firefox')
    expect(parsed.system).toBe('linux')
  })

  it('reads Safari on iOS', () => {
    const parsed = parseUserAgent(SAFARI_IPHONE)
    expect(parsed.browser).toBe('safari')
    expect(parsed.system).toBe('ios')
  })

  it('reads Chrome on Android', () => {
    const parsed = parseUserAgent(ANDROID)
    expect(parsed.browser).toBe('chrome')
    expect(parsed.system).toBe('android')
  })

  it('keeps the raw string when nothing is recognised', () => {
    const parsed = parseUserAgent('some-agent/1.0')
    expect(parsed.browser).toBeNull()
    expect(parsed.system).toBeNull()
    expect(parsed.raw).toBe('some-agent/1.0')
  })

  it('truncates a long raw string', () => {
    const parsed = parseUserAgent('x'.repeat(200))
    expect(parsed.raw.length).toBeLessThanOrEqual(60)
  })

  it('handles a missing agent string', () => {
    const parsed = parseUserAgent(null)
    expect(parsed.browser).toBeNull()
    expect(parsed.system).toBeNull()
    expect(parsed.raw).toBe('')
  })
})
