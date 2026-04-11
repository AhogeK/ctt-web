import { describe, it, expect } from 'vitest'
import {
  REGEX_DISPLAY_NAME,
  RegisterFormSchema,
  RegisterRequestSchema,
  StrongPasswordSchema,
  VerifyEmailParamSchema,
  ResendVerificationRequestSchema,
} from '../auth.schema'
import type { RegisterForm, RegisterRequest } from '../auth.schema'

describe('REGEX_DISPLAY_NAME', () => {
  it('matches minimum length (2 chars)', () => {
    expect(REGEX_DISPLAY_NAME.test('ab')).toBe(true)
  })

  it('matches maximum length (50 chars)', () => {
    const name50 = 'a'.repeat(50)
    expect(REGEX_DISPLAY_NAME.test(name50)).toBe(true)
  })

  it('matches CJK characters', () => {
    expect(REGEX_DISPLAY_NAME.test('张三')).toBe(true)
  })

  it('rejects too short (1 char)', () => {
    expect(REGEX_DISPLAY_NAME.test('a')).toBe(false)
  })

  it('rejects special chars not allowed', () => {
    expect(REGEX_DISPLAY_NAME.test('ab!')).toBe(false)
  })
})

describe('StrongPasswordSchema', () => {
  it('accepts password meeting all requirements', () => {
    const result = StrongPasswordSchema.safeParse('SecurePass1!')
    expect(result.success).toBe(true)
  })

  it('rejects password missing uppercase', () => {
    const result = StrongPasswordSchema.safeParse('securepass1!')
    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.message).toContain('uppercase')
  })

  it('rejects password missing lowercase', () => {
    const result = StrongPasswordSchema.safeParse('SECUREPASS1!')
    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.message).toContain('lowercase')
  })

  it('rejects password missing digit', () => {
    const result = StrongPasswordSchema.safeParse('SecurePass!!')
    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.message).toContain('digit')
  })

  it('rejects password missing special character', () => {
    const result = StrongPasswordSchema.safeParse('SecurePass1')
    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.message).toContain('special character')
  })

  it('rejects password too short (7 chars)', () => {
    const result = StrongPasswordSchema.safeParse('Secur1!')
    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.message).toContain('8 characters')
  })

  it('rejects password too long (33 chars)', () => {
    const longPassword = 'SecurePass1!' + 'a'.repeat(21) // 12 + 21 = 33 chars
    const result = StrongPasswordSchema.safeParse(longPassword)
    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.message).toContain('32 characters')
  })

  it('rejects empty string', () => {
    const result = StrongPasswordSchema.safeParse('')
    expect(result.success).toBe(false)
  })

  it('rejects password with disallowed special character', () => {
    const result = StrongPasswordSchema.safeParse('SecurePass1^')
    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.message).toContain('special character')
  })
})

describe('RegisterRequestSchema', () => {
  it('accepts valid registration data', () => {
    const validData = {
      email: 'user@example.com',
      displayName: 'TestUser',
      password: 'SecurePass1!',
    }
    const result = RegisterRequestSchema.safeParse(validData)

    expect(result.success).toBe(true)
    if (!result.success) {
      throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
    }
    expect(result.data.email).toBe('user@example.com')
    expect(result.data.displayName).toBe('TestUser')
    expect(result.data.password).toBe('SecurePass1!')
  })

  it('rejects missing email', () => {
    const invalidData = {
      displayName: 'TestUser',
      password: 'SecurePass1!',
    }
    const result = RegisterRequestSchema.safeParse(invalidData)

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['email'])
  })

  it('rejects invalid email format', () => {
    const invalidData = {
      email: 'not-an-email',
      displayName: 'TestUser',
      password: 'SecurePass1!',
    }
    const result = RegisterRequestSchema.safeParse(invalidData)

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['email'])
  })

  it('rejects displayName too short', () => {
    const invalidData = {
      email: 'user@example.com',
      displayName: 'a',
      password: 'SecurePass1!',
    }
    const result = RegisterRequestSchema.safeParse(invalidData)

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['displayName'])
  })

  it('rejects displayName with invalid characters', () => {
    const invalidData = {
      email: 'user@example.com',
      displayName: 'ab!',
      password: 'SecurePass1!',
    }
    const result = RegisterRequestSchema.safeParse(invalidData)

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['displayName'])
  })

  it('accepts CJK displayName', () => {
    const validData = {
      email: 'user@example.com',
      displayName: '张三',
      password: 'SecurePass1!',
    }
    const result = RegisterRequestSchema.safeParse(validData)

    expect(result.success).toBe(true)
    if (!result.success) {
      throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
    }
    expect(result.data.displayName).toBe('张三')
  })
})

describe('RegisterFormSchema', () => {
  it('accepts valid form data with matching passwords', () => {
    const validData = {
      email: 'user@example.com',
      displayName: 'TestUser',
      password: 'SecurePass1!',
      confirmPassword: 'SecurePass1!',
    }
    const result = RegisterFormSchema.safeParse(validData)

    expect(result.success).toBe(true)
    if (!result.success) {
      throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
    }
    expect(result.data.confirmPassword).toBe('SecurePass1!')
  })

  it('rejects password mismatch with error on confirmPassword path', () => {
    const invalidData = {
      email: 'user@example.com',
      displayName: 'TestUser',
      password: 'SecurePass1!',
      confirmPassword: 'DifferentPass1!',
    }
    const result = RegisterFormSchema.safeParse(invalidData)

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['confirmPassword'])
    expect(result.error.issues[0]?.message).toBe('Passwords do not match')
  })

  it('rejects missing confirmPassword', () => {
    const invalidData = {
      email: 'user@example.com',
      displayName: 'TestUser',
      password: 'SecurePass1!',
    }
    const result = RegisterFormSchema.safeParse(invalidData)

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['confirmPassword'])
  })

  it('inherits email validation from RegisterRequestSchema', () => {
    const invalidData = {
      email: 'not-an-email',
      displayName: 'TestUser',
      password: 'SecurePass1!',
      confirmPassword: 'SecurePass1!',
    }
    const result = RegisterFormSchema.safeParse(invalidData)

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['email'])
  })
})

describe('Type inference', () => {
  it('RegisterRequest type has email, displayName, password fields', () => {
    const _typeCheck: RegisterRequest = {
      email: 'test@example.com',
      displayName: 'Test',
      password: 'SecurePass1!',
    }
    expect(_typeCheck.email).toBe('test@example.com')
    expect(_typeCheck.displayName).toBe('Test')
    expect(_typeCheck.password).toBe('SecurePass1!')
  })

  it('RegisterForm type extends RegisterRequest with confirmPassword', () => {
    const _typeCheck: RegisterForm = {
      email: 'test@example.com',
      displayName: 'Test',
      password: 'SecurePass1!',
      confirmPassword: 'SecurePass1!',
    }
    expect(_typeCheck.confirmPassword).toBe('SecurePass1!')
    expect(_typeCheck.email).toBe('test@example.com')
    expect(_typeCheck.displayName).toBe('Test')
    expect(_typeCheck.password).toBe('SecurePass1!')
  })
})

describe('VerifyEmailParamSchema', () => {
  it('accepts valid token', () => {
    const validData = { token: 'abc123-verify-token' }
    const result = VerifyEmailParamSchema.safeParse(validData)
    expect(result.success).toBe(true)
    if (!result.success) {
      throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
    }
    expect(result.data.token).toBe('abc123-verify-token')
  })

  it('rejects empty token', () => {
    const invalidData = { token: '' }
    const result = VerifyEmailParamSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['token'])
  })

  it('rejects missing token', () => {
    const invalidData = {}
    const result = VerifyEmailParamSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['token'])
  })
})

describe('ResendVerificationRequestSchema', () => {
  it('accepts valid email', () => {
    const validData = { email: 'user@example.com' }
    const result = ResendVerificationRequestSchema.safeParse(validData)
    expect(result.success).toBe(true)
    if (!result.success) {
      throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
    }
    expect(result.data.email).toBe('user@example.com')
  })

  it('rejects invalid email format', () => {
    const invalidData = { email: 'not-an-email' }
    const result = ResendVerificationRequestSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['email'])
  })

  it('rejects missing email', () => {
    const invalidData = {}
    const result = ResendVerificationRequestSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['email'])
  })

  it('rejects empty email', () => {
    const invalidData = { email: '' }
    const result = ResendVerificationRequestSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['email'])
  })
})
