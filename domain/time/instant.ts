import { Duration } from './duration'
import type { Brand } from '@/domain/brand'

type TYear = `${number}${number}${number}${number}`
type TMonth = `${number}${number}`
type TDay = `${number}${number}`
type THours = `${number}${number}`
type TMinutes = `${number}${number}`
type TSeconds = `${number}${number}`
type TMilliseconds = `${number}${number}${number}`

type TISODate = `${TYear}-${TMonth}-${TDay}`
type TISOTime = `${THours}:${TMinutes}:${TSeconds}.${TMilliseconds}`

/**
 * Shape of a UTC ISO 8601 timestamp literal
 *
 * @remarks
 * Catches structural typos where a literal is written by hand, but nothing more: `${number}`
 * enforces a minimum field width, not an exact one, and knows nothing about calendars. Both
 * `2026-13-45T99:99:99.999Z` and a five-digit year satisfy this type. {@link ISO8601String}
 * closes that gap at runtime.
 */
export type ISO8601Literal = `${TISODate}T${TISOTime}Z`

/**
 * A validated instant on the UTC timeline
 *
 * @remarks
 * The trailing `Z` is mandatory by design. Storing only UTC means two instants can be
 * compared, and a {@link Duration} added, without consulting a time zone. Rendering in
 * Europe/Oslo is a presentation concern and belongs at the view layer.
 */
export type ISO8601String = Brand<ISO8601Literal, 'ISO8601String'>

/** Alias pairing the type with the {@link Instant} operations */
export type Instant = ISO8601String

const PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

/**
 * Check that a string is a real UTC timestamp, not merely a well-shaped one
 *
 * @remarks
 * The pattern fixes each field to its exact width; the round trip through `Date` rejects
 * values that are numerically impossible, such as month 13 or 30 February.
 */
const isValid = (value: string): boolean => {
  if (!PATTERN.test(value)) return false
  const parsed = new Date(value)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value
}

const epochOf = (instant: ISO8601String): number => new Date(instant).getTime()

/**
 * Instants on the UTC timeline
 *
 * @remarks
 * The difference between two instants is a {@link Duration}, which is unsigned. Subtraction
 * therefore follows Rust's `Instant::duration_since` family: the plain form throws when the
 * arguments are in the wrong order, `checked*` returns null, and `saturating*` clamps to zero.
 */
export const Instant = {
  /**
   * Narrow an untrusted value to an instant
   */
  is: (value: unknown): value is ISO8601String =>
    typeof value === 'string' && isValid(value),

  /**
   * Parse a timestamp literal
   *
   * @throws RangeError when the literal is well-shaped but not a real timestamp
   */
  parse: (value: ISO8601Literal): ISO8601String => {
    if (!isValid(value))
      throw new RangeError(`Not a valid UTC ISO 8601 timestamp: ${value}`)
    return value as ISO8601String
  },

  /**
   * Parse an instant from an untrusted string, such as a database read
   *
   * @returns The instant, or null when the string is not a valid UTC timestamp
   */
  tryParse: (value: string): ISO8601String | null =>
    isValid(value) ? (value as ISO8601String) : null,

  /**
   * Convert a `Date` to an instant
   *
   * @throws RangeError when the date is invalid
   */
  of: (date: Date): ISO8601String => {
    if (Number.isNaN(date.getTime()))
      throw new RangeError('Cannot convert an invalid Date')
    return date.toISOString() as ISO8601String
  },

  /** The current instant */
  now: (): ISO8601String => new Date().toISOString() as ISO8601String,

  toDate: (instant: ISO8601String): Date => new Date(instant),

  add: (instant: ISO8601String, duration: Duration): ISO8601String =>
    new Date(
      epochOf(instant) + Duration.asMillis(duration),
    ).toISOString() as ISO8601String,

  sub: (instant: ISO8601String, duration: Duration): ISO8601String =>
    new Date(
      epochOf(instant) - Duration.asMillis(duration),
    ).toISOString() as ISO8601String,

  /**
   * Measure the span between two instants
   *
   * @throws RangeError when `earlier` is after `later`
   */
  durationSince: (later: ISO8601String, earlier: ISO8601String): Duration => {
    const span = Instant.checkedDurationSince(later, earlier)
    if (!span) throw new RangeError(`${earlier} is after ${later}`)
    return span
  },

  /**
   * @returns The span between two instants, or null when they are in the wrong order
   */
  checkedDurationSince: (
    later: ISO8601String,
    earlier: ISO8601String,
  ): Duration | null => {
    const millis = epochOf(later) - epochOf(earlier)
    return millis < 0 ? null : Duration.fromMillis(millis)
  },

  /**
   * @returns The span between two instants, clamped to {@link Duration.ZERO}
   */
  saturatingDurationSince: (
    later: ISO8601String,
    earlier: ISO8601String,
  ): Duration =>
    Duration.fromMillis(Math.max(0, epochOf(later) - epochOf(earlier))),

  /**
   * Order two instants
   *
   * @returns Negative when left is earlier, positive when later, zero when equal
   */
  compare: (left: ISO8601String, right: ISO8601String): number =>
    epochOf(left) - epochOf(right),
} as const
