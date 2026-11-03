import { beforeEach, describe, expect, it } from 'vite-plus/test'
import { forgetPasskeyUse, hasUsedPasskey, rememberPasskeyUse } from '../passkey-preference'

describe('passkey preference', () => {
  beforeEach(() => {
    globalThis.localStorage.clear()
  })

  it('remembers a completed passkey sign-in', () => {
    expect(hasUsedPasskey()).toBe(false)

    rememberPasskeyUse()

    expect(hasUsedPasskey()).toBe(true)
  })

  it('forgets it when asked', () => {
    rememberPasskeyUse()
    forgetPasskeyUse()

    expect(hasUsedPasskey()).toBe(false)
  })

  it('answers "no" instead of throwing when storage is unavailable', () => {
    const storage = globalThis.localStorage
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('storage disabled')
      },
    })

    try {
      expect(hasUsedPasskey()).toBe(false)
      expect(() => rememberPasskeyUse()).not.toThrow()
    } finally {
      Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage })
    }
  })
})
