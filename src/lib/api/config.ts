import { ofetch } from 'ofetch'
import { z } from 'zod'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export const PublicConfigSchema = z.object({
  termsVersion: z.string(),
})

export type PublicConfig = z.infer<typeof PublicConfigSchema>

export async function getPublicConfig(): Promise<PublicConfig> {
  const data = await ofetch(`${BASE_URL}/v1/config/public`)
  return PublicConfigSchema.parse(data)
}
