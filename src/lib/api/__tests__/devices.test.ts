import { describe, it, expect, vi, beforeEach } from 'vite-plus/test'
import { listDevices, revokeDevice } from '@/lib/api/devices'
import { apiFetch } from '@/lib/api/instance'

vi.mock('../instance', () => ({
  apiFetch: vi.fn<() => Promise<unknown>>(),
}))

const mockApiFetch = vi.mocked(apiFetch)

/**
 * A valid device payload matching the DeviceResponse DTO.
 * Timestamps use the backend's microsecond-precision ISO format.
 */
const devicePayload = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  deviceName: 'MacBook Pro',
  platform: 'macOS',
  ideName: 'IntelliJ IDEA',
  ideVersion: '2026.1',
  appVersion: '1.2.0',
  createdAt: '2026-08-29T16:13:47.695149Z',
  lastSeenAt: '2026-08-29T16:13:47.693590Z',
  revokedAt: null,
}

/** RestApiResponse envelope as returned by the backend list endpoint. */
const listEnvelope = {
  success: true,
  message: 'Operation successful',
  data: [devicePayload],
  timestamp: '2026-08-29T16:13:47.741762Z',
}

describe('devices API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listDevices', () => {
    it('sends GET request to /api/v1/devices and returns the parsed device list', async () => {
      mockApiFetch.mockResolvedValue(listEnvelope)

      const result = await listDevices()

      expect(apiFetch).toHaveBeenCalledWith('/api/v1/devices', { method: 'GET' })
      expect(result).toEqual([devicePayload])
    })

    it('returns an empty array when the backend returns an empty list', async () => {
      mockApiFetch.mockResolvedValue({ ...listEnvelope, data: [] })

      const result = await listDevices()

      expect(result).toEqual([])
    })

    it('parses nullable fields omitted by Jackson non_null as null', async () => {
      // Backend omits null fields entirely; the schema must default them to null.
      const {
        deviceName: _deviceName,
        platform: _platform,
        ideName: _ideName,
        ideVersion: _ideVersion,
        appVersion: _appVersion,
        revokedAt: _revokedAt,
        ...core
      } = devicePayload
      mockApiFetch.mockResolvedValue({ ...listEnvelope, data: [{ ...core }] })

      const [result] = await listDevices()
      expect(result).toBeDefined()

      expect(result!.deviceName).toBeNull()
      expect(result!.platform).toBeNull()
      expect(result!.ideName).toBeNull()
      expect(result!.ideVersion).toBeNull()
      expect(result!.appVersion).toBeNull()
      expect(result!.revokedAt).toBeNull()
    })

    it('propagates the API error from ofetch without catching', async () => {
      mockApiFetch.mockRejectedValue({ statusCode: 404, data: { code: 'COMMON_002' } })

      await expect(listDevices()).rejects.toMatchObject({ statusCode: 404 })
    })
  })

  describe('revokeDevice', () => {
    it('sends DELETE request to /api/v1/devices/{deviceId}', async () => {
      mockApiFetch.mockResolvedValue(undefined)

      await revokeDevice('550e8400-e29b-41d4-a716-446655440000')

      expect(apiFetch).toHaveBeenCalledWith('/api/v1/devices/550e8400-e29b-41d4-a716-446655440000', {
        method: 'DELETE',
      })
    })

    it('does not parse the envelope and resolves void', async () => {
      // 200 with an envelope that carries no data — revoke is fire-and-forget.
      mockApiFetch.mockResolvedValue({ success: true, message: 'Operation successful', data: null })

      await expect(revokeDevice('550e8400-e29b-41d4-a716-446655440000')).resolves.toBeUndefined()
    })

    it('propagates the API error from ofetch without catching', async () => {
      mockApiFetch.mockRejectedValue({ statusCode: 409, data: { code: 'DEVICE_001' } })

      await expect(revokeDevice('550e8400-e29b-41d4-a716-446655440000')).rejects.toMatchObject({ statusCode: 409 })
    })
  })
})
