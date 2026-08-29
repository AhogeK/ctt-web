import { z } from 'zod'

// ==========================================
// Device Schemas
// ==========================================

/**
 * Device response schema matching ctt-server DeviceResponse DTO.
 *
 * Server returns (DeviceResponse.java):
 * - id: UUID format identifier
 * - deviceName: Human-readable device name
 * - platform: Operating system platform
 * - ideName: IDE name
 * - ideVersion: IDE version
 * - appVersion: Application or plugin version
 * - createdAt: Device registration timestamp (ISO 8601)
 * - lastSeenAt: Last activity timestamp (ISO 8601)
 * - revokedAt: Revocation timestamp (Instant | null, backend v0.50.0)
 */
export const DeviceSchema = z.object({
  // Device unique identifier in UUID format
  id: z.uuid('Invalid device ID format'),
  // Human-readable device name (may be null if not set by client)
  // .default(null): backend omits null fields (Jackson non_null), so these
  // keys arrive as undefined — nullable() alone would throw.
  deviceName: z.string().nullable().default(null),
  // Operating system platform (e.g., "macOS", "Windows", "Linux")
  platform: z.string().nullable().default(null),
  // IDE name (e.g., "IntelliJ IDEA", "PyCharm")
  ideName: z.string().nullable().default(null),
  // IDE version (e.g., "2024.1")
  ideVersion: z.string().nullable().default(null),
  // Application or plugin version (e.g., "1.2.0")
  appVersion: z.string().nullable().default(null),
  // Device registration timestamp in ISO 8601 format
  createdAt: z.string(),
  // Last activity timestamp in ISO 8601 format
  lastSeenAt: z.string(),
  // Revocation timestamp; non-null means the device was revoked (sessions
  // terminated). Backend v0.50.0; Jackson non_null omits null → default null.
  revokedAt: z.string().nullable().default(null),
})

/**
 * Schema for the list devices response (array of devices).
 */
export const DeviceListSchema = z.array(DeviceSchema)

/**
 * Device list response wrapped in REST API response format.
 */
export const DeviceListResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: DeviceListSchema,
  timestamp: z.string(),
})

/**
 * Device revoke response wrapped in REST API response format.
 */
export const DeviceRevokeResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.unknown().nullable().optional(),
  timestamp: z.string(),
})

// Export inferred types for use in API layer and components
export type Device = z.infer<typeof DeviceSchema>
export type DeviceList = z.infer<typeof DeviceListSchema>
export type DeviceListResponse = z.infer<typeof DeviceListResponseSchema>
export type DeviceRevokeResponse = z.infer<typeof DeviceRevokeResponseSchema>
