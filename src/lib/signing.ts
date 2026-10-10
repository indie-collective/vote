// Tamper-proof payloads for QR codes, Ballots and organiser sessions:
// base64url(JSON) + "." + base64url(HMAC-SHA256).

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array<ArrayBuffer> {
  const base64 = text.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function sign(payload: object, secret: string): Promise<string> {
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign("HMAC", await importKey(secret), encoder.encode(body));
  return `${body}.${toBase64Url(new Uint8Array(signature))}`;
}

/** Returns the payload if the signature is valid, otherwise null. */
export async function verify<T>(token: string | undefined, secret: string): Promise<T | null> {
  if (!token) return null;
  const [body, signature, ...rest] = token.split(".");
  if (!body || !signature || rest.length) return null;
  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await importKey(secret),
      fromBase64Url(signature),
      encoder.encode(body)
    );
    return valid ? (JSON.parse(decoder.decode(fromBase64Url(body))) as T) : null;
  } catch {
    return null;
  }
}
