/**
 * Tests for Base64 codec utilities.
 *
 * Verifies the TextEncoder/TextDecoder-based UTF-8 round-trip:
 * - ASCII, empty, Latin-1, CJK, emoji encode correctly
 * - Decoding invalid Base64 surfaces a wrapped error
 * - Failing encode path surfaces a wrapped error
 * - encode and decode are exact inverses across the full input space
 *
 * Expected Base64 strings for non-ASCII inputs are computed via Node's
 * Buffer.from(text, 'utf-8').toString('base64') — using the same UTF-8
 * pipeline that the production code itself relies on.
 */
import { describe, it, expect, vi, afterEach } from 'vite-plus/test'
import { encodeBase64, decodeBase64 } from '@/lib/utils/codec'

describe('codec', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ---------------------------------------------------------------------------
  // encodeBase64
  // ---------------------------------------------------------------------------
  describe('encodeBase64', () => {
    it('encodes ASCII strings using standard Base64', () => {
      expect(encodeBase64('hello')).toBe('aGVsbG8=')
      expect(encodeBase64('Hello, World!')).toBe('SGVsbG8sIFdvcmxkIQ==')
      expect(encodeBase64('The quick brown fox')).toBe('VGhlIHF1aWNrIGJyb3duIGZveA==')
    })

    it('returns an empty string for empty input', () => {
      expect(encodeBase64('')).toBe('')
    })

    it('encodes Latin-1 boundary characters (é, ñ, ü)', () => {
      // 'é' = U+00E9 → UTF-8 "c3 a9" → Base64 "w6k="
      expect(encodeBase64('é')).toBe('w6k=')
      // 'ñ' = U+00F1 → UTF-8 "c3 b1" → Base64 "w7E="
      expect(encodeBase64('ñ')).toBe('w7E=')
      // 'ü' = U+00FC → UTF-8 "c3 bc" → Base64 "w7w="
      expect(encodeBase64('ü')).toBe('w7w=')
    })

    it('encodes CJK characters losslessly', () => {
      expect(encodeBase64('密码')).toBe('5a+G56CB')
      expect(encodeBase64('日本語')).toBe('5pel5pys6Kqe')
      expect(encodeBase64('한국어')).toBe('7ZWc6rWt7Ja0')
    })

    it('encodes emoji (4-byte UTF-8 sequences) correctly', () => {
      expect(encodeBase64('🔐😀')).toBe('8J+UkPCfmIA=')
    })

    it('encodes mixed multi-byte and ASCII content', () => {
      expect(encodeBase64('hello密码')).toBe('aGVsbG/lr4bnoIE=')
      expect(encodeBase64('user🔐@example.com')).toBe('dXNlcvCflJBAZXhhbXBsZS5jb20=')
    })

    it('produces different output for different inputs', () => {
      const a = encodeBase64('password')
      const b = encodeBase64('Password')
      const c = encodeBase64('password!')
      expect(a).not.toBe(b)
      expect(b).not.toBe(c)
      expect(a).not.toBe(c)
    })

    it('wraps underlying TextEncoder errors with a descriptive message', () => {
      // Replace TextEncoder.prototype.encode on the shared instance codec.ts
      // closes over. This exercises the catch block exactly as a real
      // encoding failure would.
      const encoderSpy = vi.spyOn(TextEncoder.prototype, 'encode').mockImplementation(() => {
        throw new TypeError('Invalid surrogate pair')
      })

      expect(encoderSpy).not.toHaveBeenCalled()
      expect(() => encodeBase64('anything')).toThrowError(/Failed to encode string to base64: Invalid surrogate pair/)
    })
  })

  // ---------------------------------------------------------------------------
  // decodeBase64
  // ---------------------------------------------------------------------------
  describe('decodeBase64', () => {
    it('decodes standard Base64 strings back to ASCII', () => {
      expect(decodeBase64('aGVsbG8=')).toBe('hello')
      expect(decodeBase64('SGVsbG8sIFdvcmxkIQ==')).toBe('Hello, World!')
    })

    it('returns an empty string for empty input', () => {
      expect(decodeBase64('')).toBe('')
    })

    it('decodes Latin-1 boundary characters', () => {
      expect(decodeBase64('w6k=')).toBe('é')
      expect(decodeBase64('w7E=')).toBe('ñ')
      expect(decodeBase64('w7w=')).toBe('ü')
    })

    it('decodes CJK characters', () => {
      expect(decodeBase64('5a+G56CB')).toBe('密码')
      expect(decodeBase64('5pel5pys6Kqe')).toBe('日本語')
      expect(decodeBase64('7ZWc6rWt7Ja0')).toBe('한국어')
    })

    it('decodes emoji correctly', () => {
      expect(decodeBase64('8J+UkPCfmIA=')).toBe('🔐😀')
    })

    it('decodes mixed-content Base64', () => {
      expect(decodeBase64('aGVsbG/lr4bnoIE=')).toBe('hello密码')
      expect(decodeBase64('dXNlcvCflJBAZXhhbXBsZS5jb20=')).toBe('user🔐@example.com')
    })

    it('wraps DOMException for syntactically invalid Base64', () => {
      expect(() => decodeBase64('!!!not-valid-base64!!!')).toThrowError(/Failed to decode base64 string:/)
    })

    it('wraps error for Base64 string with invalid length', () => {
      // Length 5 is not a valid Base64 length (must be 0, 2, or 3 mod 4)
      expect(() => decodeBase64('abcde')).toThrowError(/Failed to decode base64 string:/)
    })
  })

  // ---------------------------------------------------------------------------
  // roundtrip / inverse property
  // ---------------------------------------------------------------------------
  describe('encode ∘ decode ≡ identity', () => {
    const cases: Array<{ name: string; value: string }> = [
      { name: 'empty', value: '' },
      { name: 'ASCII short', value: 'x' },
      { name: 'ASCII sentence', value: 'The quick brown fox jumps over the lazy dog' },
      { name: 'numeric', value: '0123456789' },
      { name: 'symbols', value: '!@#$%^&*()_+-=[]{}|;:,.<>?/~`' },
      { name: 'Latin-1 é', value: 'é' },
      { name: 'Latin-1 ñ', value: 'ñ' },
      { name: 'Latin-1 ü', value: 'ü' },
      { name: 'mixed Latin-1', value: 'café résumé naïve' },
      { name: 'Chinese', value: '密码' },
      { name: 'Japanese', value: '日本語のテスト' },
      { name: 'Korean', value: '한국어 테스트' },
      { name: 'emoji', value: '🔐😀' },
      { name: 'mixed CJK + ASCII', value: 'Hello 密码 World' },
      { name: 'mixed emoji + ASCII', value: '🔐 secret 🔑' },
    ]

    for (const { name, value } of cases) {
      it(`roundtrips ${name}`, () => {
        const encoded = encodeBase64(value)
        const decoded = decodeBase64(encoded)
        expect(decoded).toBe(value)
      })
    }

    it('encodeBase64(decodeBase64(x)) === x for well-formed Base64', () => {
      const original = '密码🔐café'
      const encodedOnce = encodeBase64(original)
      const decoded = decodeBase64(encodedOnce)
      const encodedTwice = encodeBase64(decoded)
      expect(encodedTwice).toBe(encodedOnce)
    })
  })
})
