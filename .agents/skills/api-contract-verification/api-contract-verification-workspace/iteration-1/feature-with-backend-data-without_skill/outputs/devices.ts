import { apiFetch } from './instance'
import { RestApiResponseSchema } from '@/lib/schemas/api.schema'
import { DeviceListSchema, type DeviceList } from '@/lib/schemas/device.schema'

/**
 * Fetches all registered devices for the authenticated user.
 *
 * Endpoint: GET /api/v1/devices
 *
 * @returns List of devices ordered by last activity time
 * @throws Error if request fails (401 unauthorized, network error)
 */
export async function listDevices(): Promise<DeviceList> {
  const response = await apiFetch<unknown>('/api/v1/devices', {
    method: 'GET',
  })

  const wrapped = RestApiResponseSchema.parse(response)
  return DeviceListSchema.parse(wrapped.data)
}

/**
 * Revokes a specific device, terminating all its active sessions.
 *
 * Endpoint: DELETE /api/v1/devices/{deviceId}
 *
 * @param deviceId - The UUID of the device to revoke
 * @throws Error if request fails (404 not found, 401 unauthorized)
 */
export async function revokeDevice(deviceId: string): Promise<void> {
  await apiFetch(`/api/v1/devices/${deviceId}`, {
    method: 'DELETE',
  })
}
