import { describe, it, expect } from 'vite-plus/test'
import { UserProfileSchema, type UserProfile } from '../user.schema'

describe('UserProfileSchema', () => {
  it('accepts valid profile with all fields populated', () => {
    const validProfile = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user@example.com',
      displayName: 'John Doe',
      emailVerified: true,
      createdAt: '2026-01-15T10:30:00Z',
      lastLoginAt: '2026-07-01T09:15:00Z',
      termsVersion: '1.0.0',
      hasPassword: true,
    }
    const result = UserProfileSchema.safeParse(validProfile)

    expect(result.success).toBe(true)
    if (!result.success) {
      throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
    }
    expect(result.data.id).toBe('550e8400-e29b-41d4-a716-446655440000')
    expect(result.data.email).toBe('user@example.com')
    expect(result.data.displayName).toBe('John Doe')
    expect(result.data.emailVerified).toBe(true)
    expect(result.data.createdAt).toBe('2026-01-15T10:30:00Z')
    expect(result.data.lastLoginAt).toBe('2026-07-01T09:15:00Z')
    expect(result.data.termsVersion).toBe('1.0.0')
  })

  it('accepts null lastLoginAt (first login before any recorded login)', () => {
    const profile = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user@example.com',
      displayName: 'John Doe',
      emailVerified: false,
      createdAt: '2026-01-15T10:30:00Z',
      lastLoginAt: null,
      termsVersion: '1.0.0',
    }
    const result = UserProfileSchema.safeParse(profile)

    expect(result.success).toBe(true)
    if (!result.success) {
      throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
    }
    expect(result.data.lastLoginAt).toBeNull()
  })

  it('accepts missing lastLoginAt (field completely absent from response)', () => {
    const profile = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user@example.com',
      displayName: 'John Doe',
      emailVerified: false,
      createdAt: '2026-01-15T10:30:00Z',
      termsVersion: '1.0.0',
    }
    const result = UserProfileSchema.safeParse(profile)

    expect(result.success).toBe(true)
    if (!result.success) {
      throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
    }
    expect(result.data.lastLoginAt).toBeNull()
  })

  it('accepts CJK displayName', () => {
    const profile = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user@example.com',
      displayName: '张三',
      emailVerified: true,
      createdAt: '2026-01-15T10:30:00Z',
      lastLoginAt: '2026-07-01T09:15:00Z',
      termsVersion: '1.0.0',
    }
    const result = UserProfileSchema.safeParse(profile)

    expect(result.success).toBe(true)
    if (!result.success) {
      throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
    }
    expect(result.data.displayName).toBe('张三')
  })

  it('rejects missing required field (email)', () => {
    const invalidProfile = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      displayName: 'John Doe',
      emailVerified: true,
      createdAt: '2026-01-15T10:30:00Z',
      lastLoginAt: '2026-07-01T09:15:00Z',
      termsVersion: '1.0.0',
    }
    const result = UserProfileSchema.safeParse(invalidProfile)

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['email'])
  })

  it('rejects missing displayName', () => {
    const invalidProfile = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user@example.com',
      emailVerified: true,
      createdAt: '2026-01-15T10:30:00Z',
      lastLoginAt: '2026-07-01T09:15:00Z',
      termsVersion: '1.0.0',
    }
    const result = UserProfileSchema.safeParse(invalidProfile)

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['displayName'])
  })

  it('rejects invalid id (not UUID format)', () => {
    const invalidProfile = {
      id: 'not-a-uuid',
      email: 'user@example.com',
      displayName: 'John Doe',
      emailVerified: true,
      createdAt: '2026-01-15T10:30:00Z',
      lastLoginAt: '2026-07-01T09:15:00Z',
      termsVersion: '1.0.0',
    }
    const result = UserProfileSchema.safeParse(invalidProfile)

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['id'])
  })

  it('rejects invalid email format', () => {
    const invalidProfile = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'not-an-email',
      displayName: 'John Doe',
      emailVerified: true,
      createdAt: '2026-01-15T10:30:00Z',
      lastLoginAt: '2026-07-01T09:15:00Z',
      termsVersion: '1.0.0',
    }
    const result = UserProfileSchema.safeParse(invalidProfile)

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['email'])
  })

  it('rejects invalid createdAt (not ISO datetime)', () => {
    const invalidProfile = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user@example.com',
      displayName: 'John Doe',
      emailVerified: true,
      createdAt: 'not-a-datetime',
      lastLoginAt: '2026-07-01T09:15:00Z',
      termsVersion: '1.0.0',
    }
    const result = UserProfileSchema.safeParse(invalidProfile)

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['createdAt'])
  })

  it('rejects invalid lastLoginAt (not ISO datetime when non-null)', () => {
    const invalidProfile = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user@example.com',
      displayName: 'John Doe',
      emailVerified: true,
      createdAt: '2026-01-15T10:30:00Z',
      lastLoginAt: 'not-a-datetime',
      termsVersion: '1.0.0',
    }
    const result = UserProfileSchema.safeParse(invalidProfile)

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['lastLoginAt'])
  })

  it('rejects wrong type for emailVerified (string instead of boolean)', () => {
    const invalidProfile = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user@example.com',
      displayName: 'John Doe',
      emailVerified: 'true',
      createdAt: '2026-01-15T10:30:00Z',
      lastLoginAt: '2026-07-01T09:15:00Z',
      termsVersion: '1.0.0',
    }
    const result = UserProfileSchema.safeParse(invalidProfile)

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['emailVerified'])
  })

  it('rejects wrong type for hasPassword (string instead of boolean)', () => {
    const invalidProfile = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user@example.com',
      displayName: 'John Doe',
      emailVerified: true,
      createdAt: '2026-01-15T10:30:00Z',
      lastLoginAt: '2026-07-01T09:15:00Z',
      termsVersion: '1.0.0',
      hasPassword: 'true',
    }
    const result = UserProfileSchema.safeParse(invalidProfile)

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['hasPassword'])
  })

  it('rejects completely empty object', () => {
    const result = UserProfileSchema.safeParse({})

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues.length).toBeGreaterThanOrEqual(6)
  })

  it('accepts termsVersion as any non-empty string (semver not enforced client-side)', () => {
    const profile = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user@example.com',
      displayName: 'John Doe',
      emailVerified: true,
      createdAt: '2026-01-15T10:30:00Z',
      lastLoginAt: null,
      termsVersion: '2.5.1-beta',
    }
    const result = UserProfileSchema.safeParse(profile)

    expect(result.success).toBe(true)
    if (!result.success) {
      throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
    }
    expect(result.data.termsVersion).toBe('2.5.1-beta')
  })

  it('accepts hasPassword=true (email/password user)', () => {
    const profile = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user@example.com',
      displayName: 'John Doe',
      emailVerified: true,
      createdAt: '2026-01-15T10:30:00Z',
      lastLoginAt: '2026-07-01T09:15:00Z',
      termsVersion: '1.0.0',
      hasPassword: true,
    }
    const result = UserProfileSchema.safeParse(profile)

    expect(result.success).toBe(true)
    if (!result.success) {
      throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
    }
    expect(result.data.hasPassword).toBe(true)
  })

  it('accepts hasPassword=false (OAuth-only user)', () => {
    const profile = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user@example.com',
      displayName: 'John Doe',
      emailVerified: true,
      createdAt: '2026-01-15T10:30:00Z',
      lastLoginAt: '2026-07-01T09:15:00Z',
      termsVersion: '1.0.0',
      hasPassword: false,
    }
    const result = UserProfileSchema.safeParse(profile)

    expect(result.success).toBe(true)
    if (!result.success) {
      throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
    }
    expect(result.data.hasPassword).toBe(false)
  })

  it('defaults hasPassword to false when field is missing', () => {
    const profile = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user@example.com',
      displayName: 'John Doe',
      emailVerified: true,
      createdAt: '2026-01-15T10:30:00Z',
      lastLoginAt: '2026-07-01T09:15:00Z',
      termsVersion: '1.0.0',
    }
    const result = UserProfileSchema.safeParse(profile)

    expect(result.success).toBe(true)
    if (!result.success) {
      throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
    }
    expect(result.data.hasPassword).toBe(false)
  })
})

describe('UserProfile type inference', () => {
  it('UserProfile type matches UserProfileSchema inferred shape', () => {
    const profile: UserProfile = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user@example.com',
      displayName: 'John Doe',
      emailVerified: true,
      createdAt: '2026-01-15T10:30:00Z',
      lastLoginAt: null,
      termsVersion: '1.0.0',
      emailChangePending: false,
      hasPassword: false,
    }
    expect(profile.id).toBe('550e8400-e29b-41d4-a716-446655440000')
    expect(profile.lastLoginAt).toBeNull()
  })
})
