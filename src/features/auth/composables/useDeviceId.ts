const DEVICE_ID_KEY = 'ctt_device_id'

/**
 * Generates and persists a unique device identifier in localStorage.
 *
 * The device ID is generated once using crypto.randomUUID() and stored
 * for subsequent page loads. This ID is sent with login requests for
 * device binding and tracking on the server.
 *
 * @returns Object with getDeviceId function
 */
export function useDeviceId() {
  function getDeviceId(): string {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY)
    if (!deviceId) {
      deviceId = crypto.randomUUID()
      localStorage.setItem(DEVICE_ID_KEY, deviceId)
    }
    return deviceId
  }

  return { getDeviceId }
}
