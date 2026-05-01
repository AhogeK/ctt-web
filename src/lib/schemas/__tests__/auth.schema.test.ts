import { describe, it, expect } from 'vite-plus/test'
import {
  REGEX_DISPLAY_NAME,
  LoginRequestSchema,
  LoginResponseSchema,
  RegisterFormSchema,
  RegisterRequestSchema,
  StrongPasswordSchema,
  VerifyEmailParamSchema,
  ResendVerificationRequestSchema,
  ForgotPasswordRequestSchema,
  ResetPasswordRequestSchema,
  ResetPasswordFormSchema,
} from '../auth.schema'
import type {
  LoginRequest,
  LoginResponse,
  RegisterForm,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ResetPasswordForm,
} from '../auth.schema'

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

describe('LoginRequestSchema', () => {
  it('accepts valid login data', () => {
    const validData = {
      email: 'user@example.com',
      password: 'SecurePass1!',
      deviceId: 'device-uuid-123',
    }
    const result = LoginRequestSchema.safeParse(validData)

    expect(result.success).toBe(true)
    if (!result.success) {
      throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
    }
    expect(result.data.email).toBe('user@example.com')
    expect(result.data.password).toBe('SecurePass1!')
    expect(result.data.deviceId).toBe('device-uuid-123')
  })

  it('rejects missing email', () => {
    const invalidData = {
      password: 'SecurePass1!',
      deviceId: 'device-uuid-123',
    }
    const result = LoginRequestSchema.safeParse(invalidData)

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['email'])
  })

  it('rejects empty email', () => {
    const invalidData = {
      email: '',
      password: 'SecurePass1!',
      deviceId: 'device-uuid-123',
    }
    const result = LoginRequestSchema.safeParse(invalidData)

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['email'])
  })

  it('rejects invalid email format', () => {
    const invalidData = {
      email: 'not-an-email',
      password: 'SecurePass1!',
      deviceId: 'device-uuid-123',
    }
    const result = LoginRequestSchema.safeParse(invalidData)

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['email'])
  })

  it('rejects missing password', () => {
    const invalidData = {
      email: 'user@example.com',
      deviceId: 'device-uuid-123',
    }
    const result = LoginRequestSchema.safeParse(invalidData)

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['password'])
  })

  it('rejects password too short (less than 8 chars)', () => {
    const invalidData = {
      email: 'user@example.com',
      password: 'Short1!',
      deviceId: 'device-uuid-123',
    }
    const result = LoginRequestSchema.safeParse(invalidData)

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.message).toContain('8 characters')
  })

  it('rejects missing deviceId', () => {
    const invalidData = {
      email: 'user@example.com',
      password: 'SecurePass1!',
    }
    const result = LoginRequestSchema.safeParse(invalidData)

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['deviceId'])
  })

  it('rejects empty deviceId', () => {
    const invalidData = {
      email: 'user@example.com',
      password: 'SecurePass1!',
      deviceId: '',
    }
    const result = LoginRequestSchema.safeParse(invalidData)

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['deviceId'])
  })

  it('rejects wrong type for email (number instead of string)', () => {
    const invalidData = {
      email: 123,
      password: 'SecurePass1!',
      deviceId: 'device-uuid-123',
    }
    const result = LoginRequestSchema.safeParse(invalidData)

    expect(result.success).toBe(false)
  })

  it('rejects wrong type for password (number instead of string)', () => {
    const invalidData = {
      email: 'user@example.com',
      password: 12345678,
      deviceId: 'device-uuid-123',
    }
    const result = LoginRequestSchema.safeParse(invalidData)

    expect(result.success).toBe(false)
  })

  it('rejects wrong type for deviceId (number instead of string)', () => {
    const invalidData = {
      email: 'user@example.com',
      password: 'SecurePass1!',
      deviceId: 12345,
    }
    const result = LoginRequestSchema.safeParse(invalidData)

    expect(result.success).toBe(false)
  })

  it('rejects completely empty object', () => {
    const result = LoginRequestSchema.safeParse({})

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues.length).toBeGreaterThanOrEqual(3)
  })

  it('accepts email with subdomain', () => {
    const validData = {
      email: 'user@sub.example.com',
      password: 'SecurePass1!',
      deviceId: 'device-uuid-123',
    }
    const result = LoginRequestSchema.safeParse(validData)

    expect(result.success).toBe(true)
  })

  it('accepts password exactly 8 characters', () => {
    const validData = {
      email: 'user@example.com',
      password: 'Aa1!aaaa',
      deviceId: 'device-uuid-123',
    }
    const result = LoginRequestSchema.safeParse(validData)

    expect(result.success).toBe(true)
  })

  it('accepts deviceId with special characters', () => {
    const validData = {
      email: 'user@example.com',
      password: 'SecurePass1!',
      deviceId: 'device-uuid_123.abc',
    }
    const result = LoginRequestSchema.safeParse(validData)

    expect(result.success).toBe(true)
  })

  it('rejects password that is long enough but fails strong policy', () => {
    const invalidData = {
      email: 'user@example.com',
      password: 'weakpassword', // 12 chars, all lowercase, no uppercase/digit/special
      deviceId: 'device-uuid-123',
    }
    const result = LoginRequestSchema.safeParse(invalidData)

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    // Should reference strong password requirements (uppercase/lowercase/digit/special)
    const message = result.error.issues[0]?.message
    expect(message).toMatch(/uppercase|lowercase|digit|special/)
  })

  it('rejects password with disallowed special character', () => {
    const invalidData = {
      email: 'user@example.com',
      password: 'SecurePass1^', // meets all requirements except ^ is not in allowed set @$!%*?&
      deviceId: 'device-uuid-123',
    }
    const result = LoginRequestSchema.safeParse(invalidData)

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    // Error message should reference disallowed characters
    expect(result.error.issues[0]?.message).toContain('special character')
  })
})

describe('LoginResponseSchema', () => {
  it('accepts valid login response', () => {
    const validData = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature',
      refreshToken: 'refresh-token-abc-123',
      expiresIn: 3600,
      tokenType: 'Bearer',
    }
    const result = LoginResponseSchema.safeParse(validData)

    expect(result.success).toBe(true)
    if (!result.success) {
      throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
    }
    expect(result.data.userId).toBe('550e8400-e29b-41d4-a716-446655440000')
    expect(result.data.accessToken).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature')
    expect(result.data.refreshToken).toBe('refresh-token-abc-123')
    expect(result.data.expiresIn).toBe(3600)
    expect(result.data.tokenType).toBe('Bearer')
  })

  it('defaults tokenType to Bearer when omitted', () => {
    const validData = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      accessToken: 'access-token-xyz',
      refreshToken: 'refresh-token-abc',
      expiresIn: 7200,
    }
    const result = LoginResponseSchema.safeParse(validData)

    expect(result.success).toBe(true)
    if (!result.success) {
      throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
    }
    expect(result.data.tokenType).toBe('Bearer')
  })

  it('rejects missing userId', () => {
    const invalidData = {
      accessToken: 'access-token-xyz',
      refreshToken: 'refresh-token-abc',
      expiresIn: 3600,
    }
    const result = LoginResponseSchema.safeParse(invalidData)

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['userId'])
  })

  it('rejects invalid userId format (not UUID)', () => {
    const invalidData = {
      userId: 'not-a-uuid',
      accessToken: 'access-token-xyz',
      refreshToken: 'refresh-token-abc',
      expiresIn: 3600,
    }
    const result = LoginResponseSchema.safeParse(invalidData)

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.message).toContain('user ID')
  })

  it('rejects missing accessToken', () => {
    const invalidData = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      refreshToken: 'refresh-token-abc',
      expiresIn: 3600,
    }
    const result = LoginResponseSchema.safeParse(invalidData)

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['accessToken'])
  })

  it('rejects empty accessToken', () => {
    const invalidData = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      accessToken: '',
      refreshToken: 'refresh-token-abc',
      expiresIn: 3600,
    }
    const result = LoginResponseSchema.safeParse(invalidData)

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['accessToken'])
  })

  it('rejects missing refreshToken', () => {
    const invalidData = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      accessToken: 'access-token-xyz',
      expiresIn: 3600,
    }
    const result = LoginResponseSchema.safeParse(invalidData)

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['refreshToken'])
  })

  it('rejects empty refreshToken', () => {
    const invalidData = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      accessToken: 'access-token-xyz',
      refreshToken: '',
      expiresIn: 3600,
    }
    const result = LoginResponseSchema.safeParse(invalidData)

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['refreshToken'])
  })

  it('rejects missing expiresIn', () => {
    const invalidData = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      accessToken: 'access-token-xyz',
      refreshToken: 'refresh-token-abc',
    }
    const result = LoginResponseSchema.safeParse(invalidData)

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['expiresIn'])
  })

  it('rejects expiresIn as float (not integer)', () => {
    const invalidData = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      accessToken: 'access-token-xyz',
      refreshToken: 'refresh-token-abc',
      expiresIn: 3600.5,
    }
    const result = LoginResponseSchema.safeParse(invalidData)

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
  })

  it('rejects expiresIn as zero', () => {
    const invalidData = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      accessToken: 'access-token-xyz',
      refreshToken: 'refresh-token-abc',
      expiresIn: 0,
    }
    const result = LoginResponseSchema.safeParse(invalidData)

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
  })

  it('rejects expiresIn as negative number', () => {
    const invalidData = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      accessToken: 'access-token-xyz',
      refreshToken: 'refresh-token-abc',
      expiresIn: -100,
    }
    const result = LoginResponseSchema.safeParse(invalidData)

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
  })

  it('rejects wrong type for userId (number instead of string)', () => {
    const invalidData = {
      userId: 12345,
      accessToken: 'access-token-xyz',
      refreshToken: 'refresh-token-abc',
      expiresIn: 3600,
    }
    const result = LoginResponseSchema.safeParse(invalidData)

    expect(result.success).toBe(false)
  })

  it('rejects wrong type for expiresIn (string instead of number)', () => {
    const invalidData = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      accessToken: 'access-token-xyz',
      refreshToken: 'refresh-token-abc',
      expiresIn: '3600',
    }
    const result = LoginResponseSchema.safeParse(invalidData)

    expect(result.success).toBe(false)
  })

  it('rejects completely empty object', () => {
    const result = LoginResponseSchema.safeParse({})

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues.length).toBeGreaterThanOrEqual(4)
  })

  it('accepts large expiresIn value (e.g., 1 year in seconds)', () => {
    const validData = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      accessToken: 'access-token-xyz',
      refreshToken: 'refresh-token-abc',
      expiresIn: 31536000, // 1 year in seconds
    }
    const result = LoginResponseSchema.safeParse(validData)

    expect(result.success).toBe(true)
    if (!result.success) {
      throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
    }
    expect(result.data.expiresIn).toBe(31536000)
  })

  it('rejects non-Bearer tokenType (e.g., Basic)', () => {
    const invalidData = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      accessToken: 'access-token-xyz',
      refreshToken: 'refresh-token-abc',
      expiresIn: 3600,
      tokenType: 'Basic',
    }
    const result = LoginResponseSchema.safeParse(invalidData)

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['tokenType'])
  })

  it('rejects lowercase bearer (case-sensitive)', () => {
    const invalidData = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      accessToken: 'access-token-xyz',
      refreshToken: 'refresh-token-abc',
      expiresIn: 3600,
      tokenType: 'bearer',
    }
    const result = LoginResponseSchema.safeParse(invalidData)

    expect(result.success).toBe(false)
  })
})

describe('Type inference', () => {
  it('LoginRequest type has email, password, deviceId fields', () => {
    const _typeCheck: LoginRequest = {
      email: 'test@example.com',
      password: 'SecurePass1!',
      deviceId: 'device-123',
    }
    expect(_typeCheck.email).toBe('test@example.com')
    expect(_typeCheck.password).toBe('SecurePass1!')
    expect(_typeCheck.deviceId).toBe('device-123')
  })

  it('LoginResponse type has userId, accessToken, refreshToken, expiresIn, tokenType fields', () => {
    const _typeCheck: LoginResponse = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600,
      tokenType: 'Bearer',
    }
    expect(_typeCheck.userId).toBe('550e8400-e29b-41d4-a716-446655440000')
    expect(_typeCheck.accessToken).toBe('access-token')
    expect(_typeCheck.refreshToken).toBe('refresh-token')
    expect(_typeCheck.expiresIn).toBe(3600)
    expect(_typeCheck.tokenType).toBe('Bearer')
  })

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

  it('tokenType infers as literal Bearer type', () => {
    // Compile-time type check: TypeScript should infer 'Bearer' literal type, not generic string
    const response: LoginResponse = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600,
      tokenType: 'Bearer', // This must be exactly 'Bearer', not any string
    }
    // Verify the tokenType is correctly typed and assigned
    expect(response.tokenType).toBe('Bearer')
  })

  it('ForgotPasswordRequest type has email field', () => {
    const _typeCheck: ForgotPasswordRequest = {
      email: 'test@example.com',
    }
    expect(_typeCheck.email).toBe('test@example.com')
  })

  it('ResetPasswordRequest type has token and newPassword fields', () => {
    const _typeCheck: ResetPasswordRequest = {
      token: 'reset-token-123',
      newPassword: 'SecurePass1!',
    }
    expect(_typeCheck.token).toBe('reset-token-123')
    expect(_typeCheck.newPassword).toBe('SecurePass1!')
  })

  it('ResetPasswordForm type has newPassword and confirmPassword only', () => {
    const _typeCheck: ResetPasswordForm = {
      newPassword: 'SecurePass1!',
      confirmPassword: 'SecurePass1!',
    }
    expect(_typeCheck.confirmPassword).toBe('SecurePass1!')
    expect(_typeCheck.newPassword).toBe('SecurePass1!')
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

describe('ForgotPasswordRequestSchema', () => {
  it('accepts valid email', () => {
    const validData = { email: 'user@example.com' }
    const result = ForgotPasswordRequestSchema.safeParse(validData)
    expect(result.success).toBe(true)
    if (!result.success) {
      throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
    }
    expect(result.data.email).toBe('user@example.com')
  })

  it('rejects invalid email format', () => {
    const invalidData = { email: 'not-an-email' }
    const result = ForgotPasswordRequestSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['email'])
  })

  it('rejects empty email', () => {
    const invalidData = { email: '' }
    const result = ForgotPasswordRequestSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['email'])
  })
})

describe('ResetPasswordRequestSchema', () => {
  it('accepts valid token with strong password', () => {
    const validData = {
      token: 'reset-token-abc-123',
      newPassword: 'SecurePass1!',
    }
    const result = ResetPasswordRequestSchema.safeParse(validData)
    expect(result.success).toBe(true)
    if (!result.success) {
      throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
    }
    expect(result.data.token).toBe('reset-token-abc-123')
    expect(result.data.newPassword).toBe('SecurePass1!')
  })

  it('rejects empty token', () => {
    const invalidData = {
      token: '',
      newPassword: 'SecurePass1!',
    }
    const result = ResetPasswordRequestSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['token'])
  })

  it('rejects weak password too short', () => {
    const invalidData = {
      token: 'reset-token-abc-123',
      newPassword: 'Sec1!',
    }
    const result = ResetPasswordRequestSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.message).toContain('8 characters')
  })

  it('rejects password missing special character', () => {
    const invalidData = {
      token: 'reset-token-abc-123',
      newPassword: 'SecurePass1',
    }
    const result = ResetPasswordRequestSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.message).toContain('special character')
  })

  it('rejects completely empty object', () => {
    const result = ResetPasswordRequestSchema.safeParse({})
    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues.length).toBeGreaterThanOrEqual(2)
  })
})

describe('ResetPasswordFormSchema', () => {
  it('accepts valid form with matching passwords', () => {
    const validData = {
      newPassword: 'SecurePass1!',
      confirmPassword: 'SecurePass1!',
    }
    const result = ResetPasswordFormSchema.safeParse(validData)
    expect(result.success).toBe(true)
    if (!result.success) {
      throw new Error(`Parse failed: ${JSON.stringify(result.error)}`)
    }
    expect(result.data.confirmPassword).toBe('SecurePass1!')
  })

  it('rejects password mismatch with error on confirmPassword path', () => {
    const invalidData = {
      newPassword: 'SecurePass1!',
      confirmPassword: 'DifferentPass1!',
    }
    const result = ResetPasswordFormSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['confirmPassword'])
    expect(result.error.issues[0]?.message).toBe('Passwords do not match')
  })

  it('rejects missing confirmPassword', () => {
    const invalidData = {
      newPassword: 'SecurePass1!',
    }
    const result = ResetPasswordFormSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.path).toStrictEqual(['confirmPassword'])
  })

  it('rejects weak password', () => {
    const invalidData = {
      newPassword: 'weak',
      confirmPassword: 'weak',
    }
    const result = ResetPasswordFormSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected parse to fail but it succeeded')
    }
    expect(result.error.issues[0]?.message).toContain('8 characters')
  })
})
