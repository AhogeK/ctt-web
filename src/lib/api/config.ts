import { ofetch } from 'ofetch'
import { z } from 'zod'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export const PublicConfigSchema = z.object({
  termsVersion: z.string(),
})

export type PublicConfig = z.infer<typeof PublicConfigSchema>

/**
 * Fetches public configuration from backend.
 *
 * Endpoint: GET /api/v1/config/public
 *
 * This endpoint does NOT require authentication.
 *
 * @returns Parsed public config containing termsVersion
 */
export async function getPublicConfig(): Promise<PublicConfig> {
  const data = await ofetch(`${BASE_URL}/v1/config/public`)
  return PublicConfigSchema.parse(data)
}
