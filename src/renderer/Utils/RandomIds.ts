/**
 * Random identifiers and capability tokens.
 *
 * Uses the Web Crypto API rather than `Math.random`, because room access tokens are the only thing
 * standing between a room client and another room's session. `crypto` is a global in the Electron
 * renderer, in the browser room bundle, and in Node 18+, so one implementation covers everywhere
 * this code runs.
 */

/** A lowercase hex string with `byteCount` bytes of entropy */
export function randomHex(byteCount: number): string {
  const bytes = new Uint8Array(byteCount);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * A prefixed random identifier, e.g. `room-1a2b3c4d5e6f7890`.
 *
 * The prefix makes ids self-describing in URLs, log lines and tournament files, which matters when
 * someone is debugging a room at 9am on a Saturday.
 */
export function randomId(prefix: string, byteCount = 8): string {
  return `${prefix}-${randomHex(byteCount)}`;
}
