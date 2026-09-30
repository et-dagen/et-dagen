import type { Brand } from '@/domain/brand'

type TDays = `${number}D`
type THours = `${number}H`
type TMinutes = `${number}M`
type TSeconds = `${number}S`

type TTimeParts =
  | THours
  | TMinutes
  | TSeconds
  | `${THours}${TMinutes}`
  | `${THours}${TSeconds}`
  | `${TMinutes}${TSeconds}`
  | `${THours}${TMinutes}${TSeconds}`

/**
 * Shape of an ISO 8601 duration literal, restricted to fixed-length components
 *
 * @remarks
 * Years and months are deliberately excluded: `P1M` has no fixed length, so it cannot be
 * added to an instant without a calendar and a time zone. Every unit here is exact, which
 * keeps duration arithmetic pure integer millisecond maths.
 */
export type DurationLiteral =
  | `P${TDays}`
  | `PT${TTimeParts}`
  | `P${TDays}T${TTimeParts}`

/**
 * A non-negative, exact span of time
 *
 * @remarks
 * Models Rust's `std::time::Duration`: unsigned, unit-agnostic, and constructed through
 * explicit factories rather than a bare number. The runtime representation is the ISO 8601
 * string itself, so a `Duration` needs no encoding step before it is persisted or sent over
 * the wire. Resolution is one millisecond; Rust's nanosecond precision has no counterpart
 * in `Date`, which is the arithmetic backend here.
 */
export type Duration = Brand<DurationLiteral, 'Duration'>

/**
 * A duration split into whole units
 *
 * @remarks
 * Structurally the record that `Intl.DurationFormat` and `Temporal.Duration` both take, so it
 * can be handed to either without translation.
 */
export interface DurationParts {
  days?: number
  hours?: number
  minutes?: number
  seconds?: number
  milliseconds?: number
}

const PATTERN =
  /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d{1,3})?)S)?)?$/

const MS_PER_SECOND = 1000
const MS_PER_MINUTE = 60 * MS_PER_SECOND
const MS_PER_HOUR = 60 * MS_PER_MINUTE
const MS_PER_DAY = 24 * MS_PER_HOUR

/**
 * Convert a candidate duration string to milliseconds
 *
 * @returns Milliseconds, or null when the string is not a valid fixed-length ISO 8601 duration
 */
const millisOf = (value: string): number | null => {
  const parts = PATTERN.exec(value)
  if (!parts) return null

  const [, days, hours, minutes, seconds] = parts
  // `P` and `PT` both match the pattern with every group empty, and neither is a duration.
  if (!days && !hours && !minutes && !seconds) return null

  return (
    Number(days ?? 0) * MS_PER_DAY +
    Number(hours ?? 0) * MS_PER_HOUR +
    Number(minutes ?? 0) * MS_PER_MINUTE +
    Number(seconds ?? 0) * MS_PER_SECOND
  )
}

/**
 * Render milliseconds as the shortest equivalent ISO 8601 duration
 */
const literalOf = (millis: number): DurationLiteral => {
  const days = Math.floor(millis / MS_PER_DAY)
  const hours = Math.floor((millis % MS_PER_DAY) / MS_PER_HOUR)
  const minutes = Math.floor((millis % MS_PER_HOUR) / MS_PER_MINUTE)
  const seconds = (millis % MS_PER_MINUTE) / MS_PER_SECOND

  const time = [
    hours ? `${hours}H` : '',
    minutes ? `${minutes}M` : '',
    seconds ? `${Number(seconds.toFixed(3))}S` : '',
  ].join('')

  if (!days && !time) return 'PT0S'
  return `P${days ? `${days}D` : ''}${time ? `T${time}` : ''}` as DurationLiteral
}

/**
 * Build a duration from a whole, non-negative millisecond count
 */
const fromMillis = (millis: number): Duration => {
  if (!Number.isSafeInteger(millis) || millis < 0) {
    throw new RangeError(
      `Duration requires a non-negative whole number of milliseconds, got ${millis}`,
    )
  }
  return literalOf(millis) as Duration
}

/**
 * Non-negative, exact spans of time
 *
 * @remarks
 * Mirrors the surface of Rust's `std::time::Duration`. Operations that can underflow come in
 * three flavours, matching Rust's convention: the plain form throws, `checked*` returns null,
 * and `saturating*` clamps to {@link Duration.ZERO}.
 */
export const Duration = {
  /** A duration of no length */
  ZERO: 'PT0S' as Duration,

  /**
   * Narrow an untrusted value to a duration
   */
  is: (value: unknown): value is Duration =>
    typeof value === 'string' && millisOf(value) !== null,

  /**
   * Parse a duration literal
   *
   * @throws RangeError when the literal is well-shaped but not a valid duration
   */
  parse: (value: DurationLiteral): Duration => {
    const parsed = Duration.tryParse(value)
    if (!parsed) throw new RangeError(`Not a valid ISO 8601 duration: ${value}`)
    return parsed
  },

  /**
   * Parse a duration from an untrusted string, such as a database read
   *
   * @returns The duration, or null when the string is not a valid duration
   */
  tryParse: (value: string): Duration | null =>
    millisOf(value) === null ? null : (value as Duration),

  fromMillis,
  fromSeconds: (seconds: number): Duration =>
    fromMillis(seconds * MS_PER_SECOND),
  fromMinutes: (minutes: number): Duration =>
    fromMillis(minutes * MS_PER_MINUTE),
  fromHours: (hours: number): Duration => fromMillis(hours * MS_PER_HOUR),
  fromDays: (days: number): Duration => fromMillis(days * MS_PER_DAY),

  /** Exact length in milliseconds */
  asMillis: (duration: Duration): number => millisOf(duration) as number,
  /** Length in whole seconds, rounded down */
  asSeconds: (duration: Duration): number =>
    Math.floor(Duration.asMillis(duration) / MS_PER_SECOND),
  /** Length in whole minutes, rounded down */
  asMinutes: (duration: Duration): number =>
    Math.floor(Duration.asMillis(duration) / MS_PER_MINUTE),
  /** Length in whole hours, rounded down */
  asHours: (duration: Duration): number =>
    Math.floor(Duration.asMillis(duration) / MS_PER_HOUR),

  /**
   * Break a duration into whole units
   *
   * @remarks
   * The shape is the platform's own duration record, accepted verbatim by
   * `Intl.DurationFormat.prototype.format` for localised display and by `Temporal.Duration.from`
   * once Temporal ships. Neither is available on Node 22, so this is the seam that will let
   * them be adopted without touching call sites.
   */
  toParts: (duration: Duration): DurationParts => {
    const millis = Duration.asMillis(duration)
    return {
      days: Math.floor(millis / MS_PER_DAY),
      hours: Math.floor((millis % MS_PER_DAY) / MS_PER_HOUR),
      minutes: Math.floor((millis % MS_PER_HOUR) / MS_PER_MINUTE),
      seconds: Math.floor((millis % MS_PER_MINUTE) / MS_PER_SECOND),
      milliseconds: millis % MS_PER_SECOND,
    }
  },

  /**
   * Build a duration from a platform duration record
   */
  fromParts: (parts: DurationParts): Duration =>
    fromMillis(
      (parts.days ?? 0) * MS_PER_DAY +
        (parts.hours ?? 0) * MS_PER_HOUR +
        (parts.minutes ?? 0) * MS_PER_MINUTE +
        (parts.seconds ?? 0) * MS_PER_SECOND +
        (parts.milliseconds ?? 0),
    ),

  isZero: (duration: Duration): boolean => Duration.asMillis(duration) === 0,

  add: (left: Duration, right: Duration): Duration =>
    fromMillis(Duration.asMillis(left) + Duration.asMillis(right)),

  /**
   * Subtract one duration from another
   *
   * @throws RangeError when the result would be negative
   */
  sub: (left: Duration, right: Duration): Duration =>
    fromMillis(Duration.asMillis(left) - Duration.asMillis(right)),

  /**
   * @returns The difference, or null when it would be negative
   */
  checkedSub: (left: Duration, right: Duration): Duration | null => {
    const millis = Duration.asMillis(left) - Duration.asMillis(right)
    return millis < 0 ? null : fromMillis(millis)
  },

  /**
   * @returns The difference, clamped to {@link Duration.ZERO}
   */
  saturatingSub: (left: Duration, right: Duration): Duration =>
    fromMillis(Math.max(0, Duration.asMillis(left) - Duration.asMillis(right))),

  mul: (duration: Duration, factor: number): Duration =>
    fromMillis(Duration.asMillis(duration) * factor),

  /**
   * Order two durations
   *
   * @returns Negative when left is shorter, positive when longer, zero when equal
   */
  compare: (left: Duration, right: Duration): number =>
    Duration.asMillis(left) - Duration.asMillis(right),
} as const
