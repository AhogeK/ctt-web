import { describe, expect, it } from 'vite-plus/test'
import { ApiKeySchema, CreateApiKeyRequestSchema } from '../api-key.schema'

describe('CreateApiKeyRequestSchema', () => {
  it('accepts a valid request with recommended scopes', () => {
    const result = CreateApiKeyRequestSchema.safeParse({
      name: 'MacBook Pro - IntelliJ',
      scopes: ['READ', 'SYNC'],
    })
    expect(result.success).toBe(true)
  })

  it('accepts an optional future expiresAt', () => {
    const future = new Date(Date.now() + 30 * 86_400_000).toISOString()
    const result = CreateApiKeyRequestSchema.safeParse({
      name: 'Workstation',
      scopes: ['READ'],
      expiresAt: future,
    })
    expect(result.success).toBe(true)
  })

  it('rejects an empty name', () => {
    const result = CreateApiKeyRequestSchema.safeParse({ name: '', scopes: ['READ'] })
    expect(result.success).toBe(false)
  })

  it('rejects a name longer than 100 characters', () => {
    const result = CreateApiKeyRequestSchema.safeParse({ name: 'x'.repeat(101), scopes: ['READ'] })
    expect(result.success).toBe(false)
  })

  it('rejects an empty scopes array', () => {
    const result = CreateApiKeyRequestSchema.safeParse({ name: 'Key', scopes: [] })
    expect(result.success).toBe(false)
  })

  it('rejects an unknown scope value', () => {
    const result = CreateApiKeyRequestSchema.safeParse({ name: 'Key', scopes: ['EXECUTE'] })
    expect(result.success).toBe(false)
  })

  it('rejects an expiration in the past', () => {
    const past = new Date(Date.now() - 86_400_000).toISOString()
    const result = CreateApiKeyRequestSchema.safeParse({
      name: 'Key',
      scopes: ['READ'],
      expiresAt: past,
    })
    expect(result.success).toBe(false)
  })

  it('rejects a malformed expiresAt value', () => {
    const result = CreateApiKeyRequestSchema.safeParse({
      name: 'Key',
      scopes: ['READ'],
      expiresAt: 'not-a-date',
    })
    expect(result.success).toBe(false)
  })
})

describe('ApiKeySchema', () => {
  const baseKey = {
    id: 'key-1',
    name: 'Test Key',
    keyPrefix: 'cttak_a1b2c3d4',
    scopes: ['READ'],
    createdAt: '2026-07-01T00:00:00Z',
    status: 'ACTIVE',
  }

  it('accepts explicit null for the nullable timestamps', () => {
    const result = ApiKeySchema.safeParse({
      ...baseKey,
      lastUsedAt: null,
      expiresAt: null,
      revokedAt: null,
    })
    expect(result.success).toBe(true)
  })

  it('accepts absent nullable timestamps (Jackson non_null serialization)', () => {
    // ctt-server runs jackson.default-property-inclusion: non_null, so a
    // fresh key's lastUsedAt/revokedAt (and an unexpiring key's expiresAt)
    // are OMITTED from the JSON body rather than sent as null. The schema
    // must treat undefined as null, or create/list parsing throws ZodError.
    const result = ApiKeySchema.safeParse(baseKey)
    expect(result.success).toBe(true)
    const parsed = ApiKeySchema.parse(baseKey)
    expect(parsed.lastUsedAt).toBeNull()
    expect(parsed.expiresAt).toBeNull()
    expect(parsed.revokedAt).toBeNull()
  })

  it('rejects a missing createdAt', () => {
    const { createdAt: _createdAt, ...withoutCreatedAt } = baseKey
    const result = ApiKeySchema.safeParse(withoutCreatedAt)
    expect(result.success).toBe(false)
  })
})
