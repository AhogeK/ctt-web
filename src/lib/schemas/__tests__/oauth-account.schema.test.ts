import { describe, it, expect } from 'vite-plus/test'
import { OAuthAccountBindingSchema, OAuthAccountsResponseDataSchema } from '../oauth-account.schema'

describe('OAuthAccountBindingSchema', () => {
  it('accepts a fully populated GitHub binding', () => {
    const result = OAuthAccountBindingSchema.safeParse({
      provider: 'github',
      providerLogin: 'octocat',
      providerEmail: 'octocat@example.com',
      createdAt: '2026-04-22T10:00:00Z',
      updatedAt: '2026-06-28T12:00:00Z',
    })

    expect(result.success).toBe(true)
    if (!result.success) {
      throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
    }
    expect(result.data.provider).toBe('github')
    expect(result.data.providerLogin).toBe('octocat')
    expect(result.data.providerEmail).toBe('octocat@example.com')
  })

  it('accepts a binding with null providerLogin and null providerEmail', () => {
    const result = OAuthAccountBindingSchema.safeParse({
      provider: 'github',
      providerLogin: null,
      providerEmail: null,
      createdAt: '2026-04-22T10:00:00Z',
      updatedAt: '2026-06-28T12:00:00Z',
    })

    expect(result.success).toBe(true)
    if (!result.success) {
      throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
    }
    expect(result.data.providerLogin).toBeNull()
    expect(result.data.providerEmail).toBeNull()
  })

  it('accepts a future provider identifier (forward-compat)', () => {
    const result = OAuthAccountBindingSchema.safeParse({
      provider: 'gitlab',
      providerLogin: 'gl-user',
      providerEmail: 'gl@example.com',
      createdAt: '2026-04-22T10:00:00Z',
      updatedAt: '2026-06-28T12:00:00Z',
    })

    expect(result.success).toBe(true)
    if (!result.success) {
      throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
    }
    expect(result.data.provider).toBe('gitlab')
  })

  it('rejects empty provider string', () => {
    const result = OAuthAccountBindingSchema.safeParse({
      provider: '',
      providerLogin: 'octocat',
      providerEmail: 'octocat@example.com',
      createdAt: '2026-04-22T10:00:00Z',
      updatedAt: '2026-06-28T12:00:00Z',
    })

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['provider'])
  })

  it('rejects missing provider', () => {
    const result = OAuthAccountBindingSchema.safeParse({
      providerLogin: 'octocat',
      providerEmail: 'octocat@example.com',
      createdAt: '2026-04-22T10:00:00Z',
      updatedAt: '2026-06-28T12:00:00Z',
    })

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['provider'])
  })

  it('rejects non-ISO createdAt timestamp', () => {
    const result = OAuthAccountBindingSchema.safeParse({
      provider: 'github',
      providerLogin: 'octocat',
      providerEmail: 'octocat@example.com',
      createdAt: 'not-a-date',
      updatedAt: '2026-06-28T12:00:00Z',
    })

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['createdAt'])
  })

  it('rejects missing updatedAt', () => {
    const result = OAuthAccountBindingSchema.safeParse({
      provider: 'github',
      providerLogin: 'octocat',
      providerEmail: 'octocat@example.com',
      createdAt: '2026-04-22T10:00:00Z',
    })

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['updatedAt'])
  })

  it('rejects completely empty object', () => {
    const result = OAuthAccountBindingSchema.safeParse({})
    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues.length).toBeGreaterThanOrEqual(3)
  })
})

describe('OAuthAccountsResponseDataSchema', () => {
  it('accepts a response with one GitHub binding', () => {
    const result = OAuthAccountsResponseDataSchema.safeParse({
      accounts: [
        {
          provider: 'github',
          providerLogin: 'octocat',
          providerEmail: 'octocat@example.com',
          createdAt: '2026-04-22T10:00:00Z',
          updatedAt: '2026-06-28T12:00:00Z',
        },
      ],
    })

    expect(result.success).toBe(true)
    if (!result.success) {
      throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
    }
    expect(result.data.accounts).toHaveLength(1)
    expect(result.data.accounts[0]?.provider).toBe('github')
  })

  it('accepts an empty accounts list (no bindings)', () => {
    const result = OAuthAccountsResponseDataSchema.safeParse({
      accounts: [],
    })

    expect(result.success).toBe(true)
    if (!result.success) {
      throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
    }
    expect(result.data.accounts).toHaveLength(0)
  })

  it('accepts multiple bindings (future: GitHub + Google, etc.)', () => {
    const result = OAuthAccountsResponseDataSchema.safeParse({
      accounts: [
        {
          provider: 'github',
          providerLogin: 'octocat',
          providerEmail: 'octocat@example.com',
          createdAt: '2026-04-22T10:00:00Z',
          updatedAt: '2026-06-28T12:00:00Z',
        },
        {
          provider: 'google',
          providerLogin: 'octo.cat',
          providerEmail: 'octo.cat@gmail.com',
          createdAt: '2026-05-01T08:00:00Z',
          updatedAt: '2026-05-01T08:00:00Z',
        },
      ],
    })

    expect(result.success).toBe(true)
    if (!result.success) {
      throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
    }
    expect(result.data.accounts).toHaveLength(2)
  })

  it('rejects missing accounts field', () => {
    const result = OAuthAccountsResponseDataSchema.safeParse({})
    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['accounts'])
  })

  it('rejects non-array accounts field', () => {
    const result = OAuthAccountsResponseDataSchema.safeParse({ accounts: 'not-an-array' })
    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['accounts'])
  })

  it('rejects array containing a binding with invalid shape', () => {
    const result = OAuthAccountsResponseDataSchema.safeParse({
      accounts: [
        {
          provider: 'github',
          // missing createdAt and updatedAt
          providerLogin: 'octocat',
          providerEmail: 'octocat@example.com',
        },
      ],
    })

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['accounts', 0, 'createdAt'])
  })
})
