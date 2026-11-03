import { describe, expect, it } from 'vite-plus/test'
import {
  base64UrlToBytes,
  bytesToBase64Url,
  serializeAssertedCredential,
  serializeCreatedCredential,
} from '../webauthn'

const bytes = (...values: number[]) => new Uint8Array(values).buffer

describe('base64url', () => {
  it('round-trips bytes the server will parse back', () => {
    const source = bytes(0, 1, 127, 128, 254, 255)
    expect(Array.from(base64UrlToBytes(bytesToBase64Url(source)))).toEqual(Array.from(new Uint8Array(source)))
  })

  it('accepts unpadded values on both sides', () => {
    // The server sends without padding; the decoder must not need it.
    expect(Array.from(base64UrlToBytes('AQID'))).toEqual([1, 2, 3])
    expect(bytesToBase64Url(new Uint8Array([1, 2, 3]))).toBe('AQID')
  })

  it('uses the url-safe alphabet, never + or /', () => {
    const encoded = bytesToBase64Url(new Uint8Array([251, 255]))
    expect(encoded).not.toMatch(/[+/=]/)
  })
})

describe('credential serialization', () => {
  it('carries the transports the server stores', () => {
    const credential = {
      id: 'cred-1',
      rawId: bytes(1, 2, 3),
      type: 'public-key',
      response: {
        clientDataJSON: bytes(4, 5),
        attestationObject: bytes(6, 7),
        getTransports: () => ['internal', 'hybrid'],
      },
      getClientExtensionResults: () => ({}),
    } as unknown as PublicKeyCredential

    expect(serializeCreatedCredential(credential)).toEqual({
      id: 'cred-1',
      rawId: 'AQID',
      type: 'public-key',
      response: {
        clientDataJSON: 'BAU',
        attestationObject: 'Bgc',
        transports: ['internal', 'hybrid'],
      },
      clientExtensionResults: {},
    })
  })

  it('sends a null userHandle when the authenticator omits it', () => {
    const credential = {
      id: 'cred-2',
      rawId: bytes(9),
      type: 'public-key',
      response: {
        clientDataJSON: bytes(1),
        authenticatorData: bytes(2),
        signature: bytes(3),
        userHandle: null,
      },
      getClientExtensionResults: () => ({}),
    } as unknown as PublicKeyCredential

    expect(serializeAssertedCredential(credential).response.userHandle).toBeNull()
  })
})
