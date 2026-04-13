import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDeviceId } from '../useDeviceId'

const DEVICE_ID_KEY = 'ctt_device_id'

describe('useDeviceId', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {}
    return {
      getItem: vi.fn<(key: string) => string | null>((key: string) => store[key] ?? null),
      setItem: vi.fn<(key: string, value: string) => void>((key: string, value: string) => {
        store[key] = value
      }),
      removeItem: vi.fn<(key: string) => void>((key: string) => {
        delete store[key]
      }),
      clear: vi.fn<() => void>(() => {
        store = {}
      }),
    }
  })()

  beforeEach(() => {
    localStorageMock.clear()
    vi.stubGlobal('localStorage', localStorageMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe('device ID generation', () => {
    it('generates a valid UUID on first call', () => {
      const { getDeviceId } = useDeviceId()
      const deviceId = getDeviceId()

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      expect(deviceId).toMatch(uuidRegex)
    })

    it('calls crypto.randomUUID() when no stored ID exists', () => {
      const randomUUIDSpy = vi.spyOn(crypto, 'randomUUID')
      const { getDeviceId } = useDeviceId()
      getDeviceId()

      expect(randomUUIDSpy).toHaveBeenCalledOnce()
      randomUUIDSpy.mockRestore()
    })
  })

  describe('localStorage persistence', () => {
    it('stores generated ID in localStorage', () => {
      const { getDeviceId } = useDeviceId()
      getDeviceId()

      expect(localStorageMock.setItem).toHaveBeenCalledWith(DEVICE_ID_KEY, expect.any(String))
    })

    it('retrieves existing ID from localStorage on subsequent calls', () => {
      const existingId = 'test-existing-device-id'
      localStorageMock.setItem(DEVICE_ID_KEY, existingId)

      const { getDeviceId } = useDeviceId()
      const deviceId = getDeviceId()

      expect(deviceId).toBe(existingId)
      expect(localStorageMock.getItem).toHaveBeenCalledWith(DEVICE_ID_KEY)
    })

    it('does not generate new ID when one already exists', () => {
      const existingId = 'test-existing-device-id'
      localStorageMock.setItem(DEVICE_ID_KEY, existingId)

      const randomUUIDSpy = vi.spyOn(crypto, 'randomUUID')
      const { getDeviceId } = useDeviceId()
      getDeviceId()

      expect(randomUUIDSpy).not.toHaveBeenCalled()
      randomUUIDSpy.mockRestore()
    })
  })

  describe('fingerprint uniqueness', () => {
    it('returns same ID for same browser (same localStorage)', () => {
      const { getDeviceId: getId1 } = useDeviceId()
      const id1 = getId1()

      const { getDeviceId: getId2 } = useDeviceId()
      const id2 = getId2()

      expect(id1).toBe(id2)
    })

    it('returns different IDs when localStorage is cleared (simulating different device)', () => {
      const { getDeviceId: getId1 } = useDeviceId()
      const id1 = getId1()

      // Simulate different device/browser by clearing storage
      localStorageMock.clear()

      const { getDeviceId: getId2 } = useDeviceId()
      const id2 = getId2()

      expect(id1).not.toBe(id2)
    })
  })

  describe('return value', () => {
    it('returns object with getDeviceId function', () => {
      const result = useDeviceId()
      expect(result).toHaveProperty('getDeviceId')
      expect(typeof result.getDeviceId).toBe('function')
    })
  })
})
