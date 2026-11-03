/**
 * Browser-side plumbing for the Web Authentication API.
 *
 * The page never invents credential material here: it only converts between the two shapes the two
 * sides speak — `ArrayBuffer`s in the browser, base64url strings on the wire — and reports whether
 * this browser can run a ceremony at all.
 */

/** Decodes a base64url string into bytes. Padding is optional on the wire, so it is restored. */
export function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(new ArrayBuffer(binary.length))
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

/** Encodes bytes as base64url without padding, the form the server parses. */
export function bytesToBase64Url(value: ArrayBuffer | Uint8Array): string {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Whether this browser can run either ceremony.
 *
 * Checked before rendering any entry: an unsupported browser must keep the password form alone
 * rather than offering a button that cannot work.
 */
export function isPasskeySupported(): boolean {
  return typeof globalThis.PublicKeyCredential !== 'undefined'
}

/**
 * Whether the browser can offer passkeys inside the username field's autofill.
 *
 * Conditional mediation is what turns "click the field" into a list of available accounts; without
 * it the reader still gets the explicit button.
 */
export async function isConditionalMediationAvailable(): Promise<boolean> {
  const capability = globalThis.PublicKeyCredential as
    | (typeof PublicKeyCredential & {
        isConditionalMediationAvailable?: () => Promise<boolean>
      })
    | undefined
  if (!capability?.isConditionalMediationAvailable) return false
  try {
    return await capability.isConditionalMediationAvailable()
  } catch {
    return false
  }
}

/** The JSON the server expects for a freshly created credential, including its transports. */
export type SerializedCreationCredential = {
  id: string
  rawId: string
  type: 'public-key'
  response: {
    clientDataJSON: string
    attestationObject: string
    transports: string[]
  }
  clientExtensionResults: Record<string, unknown>
}

/**
 * Turns `navigator.credentials.create()` output into the request body.
 *
 * Transports live on the response object, not in the JSON, so they are read explicitly — the server
 * stores them to show how a credential can be reached later.
 *
 * @param credential - the value resolved by `credentials.create()`
 * @returns the JSON body for the registration endpoint
 */
export function serializeCreatedCredential(credential: PublicKeyCredential): SerializedCreationCredential {
  const response = credential.response as AuthenticatorAttestationResponse
  return {
    id: credential.id,
    rawId: bytesToBase64Url(credential.rawId),
    type: 'public-key',
    response: {
      clientDataJSON: bytesToBase64Url(response.clientDataJSON),
      attestationObject: bytesToBase64Url(response.attestationObject),
      transports: typeof response.getTransports === 'function' ? response.getTransports() : [],
    },
    clientExtensionResults: credential.getClientExtensionResults() as Record<string, unknown>,
  }
}

/** The JSON the server expects for an assertion. */
export type SerializedAssertionCredential = {
  id: string
  rawId: string
  type: 'public-key'
  response: {
    clientDataJSON: string
    authenticatorData: string
    signature: string
    userHandle: string | null
  }
  clientExtensionResults: Record<string, unknown>
}

/**
 * Turns `navigator.credentials.get()` output into the request body.
 *
 * A discoverable credential signs in without the page knowing who the reader is, so `userHandle`
 * is what tells the server which account answered; it is `null` when the authenticator omits it.
 *
 * @param credential - the value resolved by `credentials.get()`
 * @returns the JSON body for the assertion endpoint
 */
export function serializeAssertedCredential(credential: PublicKeyCredential): SerializedAssertionCredential {
  const response = credential.response as AuthenticatorAssertionResponse
  return {
    id: credential.id,
    rawId: bytesToBase64Url(credential.rawId),
    type: 'public-key',
    response: {
      clientDataJSON: bytesToBase64Url(response.clientDataJSON),
      authenticatorData: bytesToBase64Url(response.authenticatorData),
      signature: bytesToBase64Url(response.signature),
      userHandle: response.userHandle ? bytesToBase64Url(response.userHandle) : null,
    },
    clientExtensionResults: credential.getClientExtensionResults() as Record<string, unknown>,
  }
}
