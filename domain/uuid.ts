import type { Brand } from '@/domain/brand'

/**
 * Shape of a UUID in its canonical hyphenated form
 *
 * @remarks
 * The same template literal the platform uses for `crypto.randomUUID()`, so that return value
 * is assignable here without a cast. It only counts the hyphens: `'a-b-c-d-e'` satisfies it,
 * and so does a version 1 UUID. {@link UUIDv4} is what closes that gap.
 */
type UUIDLiteral = `${string}-${string}-${string}-${string}-${string}`

/**
 * A random (version 4) UUID
 *
 * @remarks
 * Branded because the two things that make a UUID *v4* — the version nibble and the variant
 * bits — cannot be expressed in a template literal type. A value of this type has been checked
 * for both, so it is not merely 36 characters with hyphens in the right places.
 *
 * Stored lowercase. RFC 4122 requires generators to emit lowercase but readers to accept either
 * case, which means the same id can arrive spelled two ways; canonicalising on the way in keeps
 * `===` and object-key lookups honest.
 *
 * Note this is for identifiers *this application mints*. Firebase Auth uids and Realtime
 * Database push keys are neither UUIDs nor v4, so they must not be typed with it.
 */
export type UUIDv4 = Brand<UUIDLiteral, 'UUIDv4'>

//                8 hex    4 hex    v4      variant  12 hex
const PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Random version 4 UUIDs
 */
export const UUIDv4 = {
  /**
   * Narrow an untrusted value to a v4 UUID
   *
   * @remarks
   * Rejects the nil UUID and every other version, since their version nibble is not `4`.
   */
  is: (value: unknown): value is UUIDv4 =>
    typeof value === 'string' && PATTERN.test(value),

  /**
   * Validate an identifier and canonicalise it to lowercase
   *
   * @throws RangeError when the value is not a version 4 UUID
   */
  parse: (value: string): UUIDv4 => {
    if (!PATTERN.test(value))
      throw new RangeError(`Not a version 4 UUID: ${value}`)
    return value.toLowerCase() as UUIDv4
  },

  /**
   * Parse from untrusted input, such as a database read or a route parameter
   *
   * @returns The canonicalised UUID, or null when the value is not a version 4 UUID
   */
  tryParse: (value: string): UUIDv4 | null =>
    PATTERN.test(value) ? (value.toLowerCase() as UUIDv4) : null,

  /**
   * Mint a new UUID
   *
   * @remarks
   * Delegates to the platform's CSPRNG, which is available on Node 19+ and in browsers, but
   * only in a secure context — `crypto.randomUUID` is undefined on plain `http://` origins
   * other than localhost. That case throws rather than falling back to `Math.random`, which
   * is predictable and must never generate an identifier.
   *
   * @throws Error when no cryptographic UUID generator is available
   */
  random: (): UUIDv4 => {
    if (typeof globalThis.crypto?.randomUUID !== 'function') {
      throw new TypeError(
        'crypto.randomUUID is unavailable; a secure context is required',
      )
    }
    return globalThis.crypto.randomUUID() as UUIDv4
  },
} as const
