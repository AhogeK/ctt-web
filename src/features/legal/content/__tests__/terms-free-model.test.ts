import { describe, expect, it } from 'vitest'
import { termsContent as en } from '../terms-en'
import { termsContent as zh } from '../terms-zh'

// The service is free of charge — no subscriptions, tiers, payments or fees. The terms of record
// must never describe otherwise, or the document contradicts the product in both languages.
const PRICING_CLAIMS = /subscription|tiered feature|outstanding fees|fees paid by you|订阅|分层功能|订阅期|未付费用/

describe('terms of service match the free model', () => {
  it('the English terms carry no pricing-era claims', () => {
    expect(JSON.stringify(en)).not.toMatch(PRICING_CLAIMS)
  })

  it('the Chinese terms carry no pricing-era claims', () => {
    expect(JSON.stringify(zh)).not.toMatch(PRICING_CLAIMS)
  })

  it('both languages are one revision with the same section ids', () => {
    expect(zh.version).toBe(en.version)
    expect(zh.lastUpdated).toBe(en.lastUpdated)
    expect(zh.sections.map((section) => section.id)).toEqual(en.sections.map((section) => section.id))
  })
})
