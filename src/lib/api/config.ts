import { ofetch } from 'ofetch'
import { z } from 'zod'
import { RestApiResponseSchema } from '@/lib/schemas/api.schema'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export const PublicConfigSchema = z.object({
  termsVersion: z.string(),
})

export type PublicConfig = z.infer<typeof PublicConfigSchema>

export async function getPublicConfig(): Promise<PublicConfig> {
  const response = await ofetch(`${BASE_URL}/v1/config/public`)
  const wrapped = RestApiResponseSchema.parse(response)
  return PublicConfigSchema.parse(wrapped.data)
}
