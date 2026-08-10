import type { Brand } from '@/domain/brand'

/**
 * A validated web address
 *
 * @remarks
 * A branded string rather than a `URL`, because these values are persisted. `URL` does not
 * survive a Realtime Database round trip: JSON turns it into a string while the type carries on
 * claiming otherwise, so `company.webpage.hostname` throws with nothing to warn you. The string
 * form also drops straight into the `webpage: string` props the components already declare.
 *
 * Call `new URL(value)` where the parsed API is actually wanted — validation here guarantees
 * that call cannot throw.
 */
export type HttpUrl = Brand<string, 'HttpUrl'>

/**
 * Canonical form of a web address, or null when it is not one
 *
 * @remarks
 * Only `http` and `https` are allowed. The point is less about the two being different from
 * each other than about excluding `javascript:` and `data:`, which are what turn a stored link
 * into an attack when it reaches an `href`.
 */
const canonical = (value: string): string | null => {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return null
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null

  // `href` lowercases the host and supplies the empty path, so links that differ only in
  // spelling compare equal once stored.
  return url.href
}

/**
 * Web addresses
 */
export const HttpUrl = {
  is: (value: unknown): value is HttpUrl =>
    typeof value === 'string' && canonical(value) !== null,

  /**
   * Validate an address and canonicalise it
   *
   * @throws RangeError when the value is not an http or https address
   */
  parse: (value: string): HttpUrl => {
    const href = canonical(value)
    if (href === null) throw new RangeError(`Not an http(s) URL: ${value}`)
    return href as HttpUrl
  },

  /**
   * Parse from untrusted input, such as a database read or an admin form
   *
   * @returns The canonicalised address, or null when the value is not one
   */
  tryParse: (value: string): HttpUrl | null =>
    canonical(value) as HttpUrl | null,
} as const
