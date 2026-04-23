/**
 * Generates and persists a unique device ID for login requests.
 *
 * The device ID is stored in localStorage under the key 'ctt-device-id'.
 * If an ID already exists, it is returned; otherwise, a new UUID v4 is generated.
 * This function is SSR-safe and returns an empty string when window is undefined.
 *
 * @returns The device ID string, or empty string in SSR context.
 */
export function getOrCreateDeviceId(): string {
  if (globalThis.window === undefined) {
    return ''
  }

  const STORAGE_KEY = 'ctt-device-id'

  const existingId = localStorage.getItem(STORAGE_KEY)
  if (existingId) {
    return existingId
  }

  const newId = crypto.randomUUID()
  localStorage.setItem(STORAGE_KEY, newId)

  return newId
}
