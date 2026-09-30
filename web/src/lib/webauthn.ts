// SPDX-License-Identifier: AGPL-3.0-or-later
// Bridges the server's WebAuthn JSON (base64url everywhere) and the
// browser's credential API (ArrayBuffers everywhere).

const toBytes = (s: string) => {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

const toB64 = (buf: ArrayBuffer | null) => {
  if (!buf) return null
  let s = ''
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

type Json = Record<string, any>

export async function createCredential(options: unknown) {
  const pk = (options as Json).publicKey as Json
  const cred = (await navigator.credentials.create({
    publicKey: {
      ...pk,
      challenge: toBytes(pk.challenge),
      user: { ...pk.user, id: toBytes(pk.user.id) },
      excludeCredentials: (pk.excludeCredentials ?? []).map((c: Json) => ({ ...c, id: toBytes(c.id) })),
    } as unknown as PublicKeyCredentialCreationOptions,
  })) as PublicKeyCredential
  const r = cred.response as AuthenticatorAttestationResponse
  return {
    id: cred.id,
    rawId: toB64(cred.rawId),
    type: cred.type,
    extensions: cred.getClientExtensionResults(),
    response: {
      attestationObject: toB64(r.attestationObject),
      clientDataJSON: toB64(r.clientDataJSON),
      transports: r.getTransports?.() ?? [],
    },
  }
}

export async function getCredential(options: unknown) {
  const pk = (options as Json).publicKey as Json
  const cred = (await navigator.credentials.get({
    publicKey: {
      ...pk,
      challenge: toBytes(pk.challenge),
      allowCredentials: (pk.allowCredentials ?? []).map((c: Json) => ({ ...c, id: toBytes(c.id) })),
    } as unknown as PublicKeyCredentialRequestOptions,
  })) as PublicKeyCredential
  const r = cred.response as AuthenticatorAssertionResponse
  return {
    id: cred.id,
    rawId: toB64(cred.rawId),
    type: cred.type,
    extensions: cred.getClientExtensionResults(),
    response: {
      authenticatorData: toB64(r.authenticatorData),
      clientDataJSON: toB64(r.clientDataJSON),
      signature: toB64(r.signature),
      userHandle: toB64(r.userHandle),
    },
  }
}
