import { nowIso } from '../utils/auth-helpers.js'

/**
 * Local Device shape matching the API contract (src/lib/schemas/device.schema.ts).
 * Kept local to the E2E suite; never import from src/ in specs.
 */
export interface DeviceFixture {
  id: string
  deviceName: string | null
  platform: string | null
  ideName: string | null
  ideVersion: string | null
  appVersion: string | null
  createdAt: string
  lastSeenAt: string
}

export const MAC_DEVICE_ID = '550e8400-e29b-41d4-a716-446655440000'
export const WINDOWS_DEVICE_ID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
export const LINUX_DEVICE_ID = '6ba7b811-9dad-11d1-80b4-00c04fd430c8'

/** Device active within the last 7 days — renders the Active badge and "Just now". */
export const TEST_MAC_DEVICE: DeviceFixture = {
  id: MAC_DEVICE_ID,
  deviceName: 'MacBook Pro',
  platform: 'macOS',
  ideName: 'IntelliJ IDEA',
  ideVersion: '2026.1',
  appVersion: '1.2.0',
  createdAt: '2026-08-28T10:00:00Z',
  lastSeenAt: nowIso(),
}

/** Device whose last activity is 30 days old — renders Inactive and "1mo ago". */
export const TEST_WINDOWS_DEVICE: DeviceFixture = {
  id: WINDOWS_DEVICE_ID,
  deviceName: 'Old Workstation',
  platform: 'Windows',
  ideName: null,
  ideVersion: null,
  appVersion: null,
  createdAt: '2026-06-01T10:00:00Z',
  lastSeenAt: new Date(Date.now() - 30 * 86400000).toISOString(),
}

/** Device with no deviceName — the view falls back to the IDE name. */
export const TEST_LINUX_DEVICE: DeviceFixture = {
  id: LINUX_DEVICE_ID,
  deviceName: null,
  platform: 'Linux',
  ideName: 'PyCharm',
  ideVersion: '2025.3',
  appVersion: '1.1.0',
  createdAt: '2026-07-15T10:00:00Z',
  lastSeenAt: nowIso(),
}

export const TEST_DEVICES: DeviceFixture[] = [TEST_MAC_DEVICE, TEST_WINDOWS_DEVICE, TEST_LINUX_DEVICE]

/** Reusable error bodies for the mocked error paths. */
export function errorBody(code: string, message: string): Record<string, unknown> {
  return {
    success: false,
    message,
    code,
    timestamp: nowIso(),
    traceId: 'mock-trace-id',
  }
}

export const COMMON_002_BODY = errorBody('COMMON_002', 'Device not found or access denied')
export const DEVICE_001_BODY = errorBody('DEVICE_001', 'Device already registered to another user')
export const RATE_LIMIT_BODY = errorBody('RATE_LIMIT_001', 'Too many requests, please try again later.')
