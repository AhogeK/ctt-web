import { describe, expect, it } from 'vite-plus/test'
import { CreateApiKeyRequestSchema } from '../api-key.schema'

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
