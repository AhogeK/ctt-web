import { nowIso } from '../utils/auth-helpers.js'

/**
 * Local ApiKey shape matching the API contract (src/lib/schemas/api-key.schema.ts).
 * Kept local to the E2E suite; never import from src/ in specs.
 */
export interface ApiKeyFixture {
  id: string
  name: string
  keyPrefix: string
  scopes: ('READ' | 'WRITE' | 'SYNC' | 'ADMIN')[]
  lastUsedAt: string | null
  expiresAt: string | null
  revokedAt: string | null
  createdAt: string
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED'
}

export const ACTIVE_KEY_ID = 'aaaa1111-2222-4333-8444-555566667777'
export const EXPIRED_KEY_ID = 'bbbb1111-2222-4333-8444-555566668888'
export const REVOKED_KEY_ID = 'cccc1111-2222-4333-8444-555566669999'
export const NEW_KEY_ID = 'dddd1111-2222-4333-8444-555566660000'

/** Static dates for deterministic assertions (backend timestamps are UTC). */
export const TEST_ACTIVE_KEY: ApiKeyFixture = {
  id: ACTIVE_KEY_ID,
  name: 'Production CI Key',
  keyPrefix: 'cttak_a1b2c3d4',
  scopes: ['READ', 'SYNC'],
  lastUsedAt: '2026-08-06T10:00:00.000Z',
  expiresAt: '2027-08-07T00:00:00.000Z',
  revokedAt: null,
  createdAt: '2026-01-15T00:00:00.000Z',
  status: 'ACTIVE',
}

export const TEST_EXPIRED_KEY: ApiKeyFixture = {
  id: EXPIRED_KEY_ID,
  name: 'Old Deploy Key',
  keyPrefix: 'cttak_e5f6g7h8',
  scopes: ['READ', 'WRITE'],
  lastUsedAt: '2026-06-01T12:00:00.000Z',
  expiresAt: '2026-07-01T00:00:00.000Z',
  revokedAt: null,
  createdAt: '2025-12-01T00:00:00.000Z',
  status: 'EXPIRED',
}

export const TEST_REVOKED_KEY: ApiKeyFixture = {
  id: REVOKED_KEY_ID,
  name: 'Compromised Key',
  keyPrefix: 'cttak_i9j0k1l2',
  scopes: ['ADMIN'],
  lastUsedAt: '2026-07-15T08:30:00.000Z',
  expiresAt: null,
  revokedAt: '2026-07-20T00:00:00.000Z',
  createdAt: '2026-06-01T00:00:00.000Z',
  status: 'REVOKED',
}

export const TEST_KEYS: ApiKeyFixture[] = [TEST_ACTIVE_KEY, TEST_EXPIRED_KEY, TEST_REVOKED_KEY]

/** Key returned by the mocked create endpoint; also appended to the list on success. */
export const TEST_NEW_KEY: ApiKeyFixture = {
  id: NEW_KEY_ID,
  name: 'New Test Key',
  keyPrefix: 'cttak_m3n4o5p6',
  scopes: ['READ', 'SYNC'],
  lastUsedAt: null,
  expiresAt: null,
  revokedAt: null,
  createdAt: '2026-08-07T00:00:00.000Z',
  status: 'ACTIVE',
}

export const TEST_RAW_KEY = 'cttak_m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2'

export const TEST_CREATE_RESPONSE = {
  rawKey: TEST_RAW_KEY,
  apiKey: TEST_NEW_KEY,
}

/** Reusable error bodies for the mocked error paths. */
export function errorBody(code: string, message: string): Record<string, unknown> {
  return {
    success: false,
    message,
    data: null,
    timestamp: nowIso(),
    code,
  }
}

export const AUTH_024_BODY = errorBody(
  'AUTH_024',
  'You have reached the maximum of 20 API keys. Revoke an unused key before creating a new one.',
)
export const RATE_LIMIT_BODY = errorBody('RATE_LIMIT_001', 'Too many requests, please try again later.')
/** 429 body carrying a future retryAfter Instant so the countdown toast renders. */
export const RATE_LIMIT_WITH_RETRY_AFTER_BODY: Record<string, unknown> = {
  ...errorBody('RATE_LIMIT_001', 'Too many requests, please try again later.'),
  retryAfter: new Date(Date.now() + 60_000).toISOString(),
}
export const AUTH_010_BODY = errorBody('AUTH_010', 'API key invalid')
/** 409 for permanent delete of a non-REVOKED key (backend AUTH_023). */
export const AUTH_023_BODY = errorBody('AUTH_023', 'Active API keys must be revoked before they can be deleted')
