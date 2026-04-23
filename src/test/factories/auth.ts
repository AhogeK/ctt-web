import { faker } from '@faker-js/faker'
import type { LoginRequest, LoginResponse } from '@/lib/schemas/auth.schema'

/**
 * Build a valid LoginRequest fixture.
 * Generated data passes LoginRequestSchema validation.
 */
export function buildLoginRequest(overrides: Partial<LoginRequest> = {}): LoginRequest {
  return {
    email: faker.internet.email(),
    password: 'TestPass1!',
    deviceId: faker.string.uuid(),
    ...overrides,
  }
}

/**
 * Build a valid LoginResponse fixture.
 * Generated data passes LoginResponseSchema validation.
 */
export function buildLoginResponse(overrides: Partial<LoginResponse> = {}): LoginResponse {
  return {
    userId: faker.string.uuid(),
    accessToken: faker.string.alphanumeric({ length: 32 }),
    refreshToken: faker.string.alphanumeric({ length: 32 }),
    expiresIn: faker.number.int({ min: 300, max: 86_400 }),
    tokenType: 'Bearer',
    ...overrides,
  }
}
