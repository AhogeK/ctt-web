import { describe, expect, it } from 'vite-plus/test'
import {
  ForgotPasswordFormSchema,
  RegisterFormSchema,
  ResetPasswordFormSchema,
  StrongPasswordSchema,
} from '../auth.schema'
import { CreateApiKeyRequestSchema } from '../api-key.schema'
import { UpdateProfileRequestSchema } from '../user.schema'

/**
 * Form schemas speak the catalogue's language, not Zod's.
 *
 * Zod's default wording names the runtime type ("expected string, received undefined"), which
 * means nothing to the reader and arrives in English whatever the interface language is. Each
 * field therefore carries its message on the base type too: an untouched field is `undefined`,
 * and that fails before any `.min()` rule can speak.
 *
 * This covers the schemas shared between forms. Schemas declared inside a component are checked by
 * that component's own test, because there is no module to import them from.
 */
const DEFAULT_WORDING = /Invalid input|expected string|received undefined/

type Parseable = { safeParse: (value: unknown) => { success: boolean; error?: { issues: Array<{ message: string }> } } }

function messagesOf(schema: Parseable, value: unknown): string[] {
  const result = schema.safeParse(value)
  return result.success ? [] : (result.error?.issues ?? []).map((issue) => issue.message)
}

describe('form schema messages', () => {
  const cases: Array<[string, Parseable, unknown]> = [
    ['StrongPasswordSchema', StrongPasswordSchema, undefined],
    ['RegisterFormSchema', RegisterFormSchema, {}],
    ['ForgotPasswordFormSchema', ForgotPasswordFormSchema, {}],
    ['ResetPasswordFormSchema', ResetPasswordFormSchema, {}],
    ['CreateApiKeyRequestSchema', CreateApiKeyRequestSchema, {}],
    ['UpdateProfileRequestSchema', UpdateProfileRequestSchema, {}],
  ]

  it.each(cases)("%s never answers with Zod's own wording", (_name, schema, value) => {
    const messages = messagesOf(schema, value)
    expect(messages.length).toBeGreaterThan(0)
    expect(messages.filter((message) => DEFAULT_WORDING.test(message))).toEqual([])
  })
})
