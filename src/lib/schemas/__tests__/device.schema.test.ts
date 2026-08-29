import { describe, it, expect } from 'vite-plus/test'
import { DeviceSchema, DeviceListSchema } from '@/lib/schemas/device.schema'

/** A fully-populated device matching the DeviceResponse DTO. */
const fullDevice = {
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

describe('DeviceSchema', () => {
  it('parses a fully-populated device', () => {
    const result = DeviceSchema.parse(fullDevice)
    expect(result).toEqual(fullDevice)
  })

  it('accepts null for the optional metadata fields', () => {
    const result = DeviceSchema.parse({ ...fullDevice, deviceName: null, platform: null })
    expect(result.deviceName).toBeNull()
    expect(result.platform).toBeNull()
  })

  it('defaults omitted optional fields to null (Jackson non_null)', () => {
    // Backend omits null fields entirely; schema must default them to null
    // instead of throwing on undefined.
    const {
      deviceName: _deviceName,
      platform: _platform,
      ideName: _ideName,
      ideVersion: _ideVersion,
      appVersion: _appVersion,
      revokedAt: _revokedAt,
      ...core
    } = fullDevice
    const result = DeviceSchema.parse(core)

    expect(result.deviceName).toBeNull()
    expect(result.platform).toBeNull()
    expect(result.ideName).toBeNull()
    expect(result.ideVersion).toBeNull()
    expect(result.appVersion).toBeNull()
    expect(result.revokedAt).toBeNull()
  })

  it('accepts a non-null revokedAt (device was revoked)', () => {
    const result = DeviceSchema.parse({ ...fullDevice, revokedAt: '2026-08-29T17:00:00Z' })
    expect(result.revokedAt).toBe('2026-08-29T17:00:00Z')
  })

  it('rejects a non-UUID id', () => {
    expect(() => DeviceSchema.parse({ ...fullDevice, id: 'not-a-uuid' })).toThrow('Invalid device ID format')
  })

  it('rejects a device missing createdAt', () => {
    const { createdAt: _createdAt, ...rest } = fullDevice
    expect(DeviceSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects a device missing lastSeenAt', () => {
    const { lastSeenAt: _lastSeenAt, ...rest } = fullDevice
    expect(DeviceSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects a device with an empty id', () => {
    expect(() => DeviceSchema.parse({ ...fullDevice, id: '' })).toThrow('Invalid device ID format')
  })
})

describe('DeviceListSchema', () => {
  it('parses an array of devices', () => {
    const result = DeviceListSchema.parse([fullDevice, { ...fullDevice, id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' }])
    expect(result).toHaveLength(2)
  })

  it('parses an empty array', () => {
    expect(DeviceListSchema.parse([])).toEqual([])
  })

  it('rejects a non-array payload', () => {
    expect(DeviceListSchema.safeParse(fullDevice).success).toBe(false)
  })

  it('rejects an array containing an invalid device', () => {
    expect(DeviceListSchema.safeParse([fullDevice, { id: 'invalid' }]).success).toBe(false)
  })
})
