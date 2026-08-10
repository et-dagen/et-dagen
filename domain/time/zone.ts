import { Instant, type ISO8601String } from './instant'
import type { Brand } from '@/domain/brand'

/**
 * An IANA time zone identifier, such as `Europe/Oslo`
 *
 * @remarks
 * Always a named region, never a fixed offset. `Intl` will happily accept `+02:00` as a time
 * zone, but an offset carries no daylight-saving rules: a user stored as `+02:00` in July
 * reads an hour late every winter. Only a name like `Europe/Oslo` knows when the rules change.
 */
export type TimeZone = Brand<string, 'TimeZone'>

/**
 * Wall-clock fields as a person in some zone would read them off a calendar and a clock
 *
 * @remarks
 * Deliberately not an instant. The same `LocalDateTime` denotes two different instants on the
 * evening a zone leaves daylight saving, and none at all on the morning it enters. Only
 * pairing it with a {@link TimeZone} makes it unambiguous, and even then not always.
 */
export interface LocalDateTime {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
  millisecond: number
}

const MS_PER_MINUTE = 60_000
const MS_PER_DAY = 86_400_000

const formatters = new Map<string, Intl.DateTimeFormat>()

const fieldsFormatter = (zone: TimeZone): Intl.DateTimeFormat => {
  const cached = formatters.get(zone)
  if (cached) return cached

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    // `hourCycle: 'h23'` rather than `hour12: false`, which reports midnight as hour 24.
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    era: 'short',
  })
  formatters.set(zone, formatter)
  return formatter
}

/**
 * Epoch milliseconds for a set of wall-clock fields read as if they were UTC
 *
 * @remarks
 * Goes through `setUTCFullYear` because `Date.UTC` remaps years 0-99 into the 1900s.
 */
const asUtcMillis = (fields: LocalDateTime): number => {
  const date = new Date(0)
  date.setUTCFullYear(fields.year, fields.month - 1, fields.day)
  date.setUTCHours(
    fields.hour,
    fields.minute,
    fields.second,
    fields.millisecond,
  )
  return date.getTime()
}

/**
 * Read the wall-clock fields shown in a zone at an instant
 */
const fieldsAt = (epochMillis: number, zone: TimeZone): LocalDateTime => {
  const parts = fieldsFormatter(zone).formatToParts(new Date(epochMillis))
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value)

  const year = value('year')
  const bc = parts.find((part) => part.type === 'era')?.value === 'BC'

  return {
    // `en-US` renders proleptic years as positive with an era; ISO 8601 counts 1 BC as year 0.
    year: bc ? 1 - year : year,
    month: value('month'),
    day: value('day'),
    hour: value('hour'),
    minute: value('minute'),
    second: value('second'),
    millisecond: ((epochMillis % 1000) + 1000) % 1000,
  }
}

/**
 * The zone's offset from UTC at an instant, in milliseconds east of UTC
 */
const offsetAt = (epochMillis: number, zone: TimeZone): number => {
  const whole = Math.floor(epochMillis / 1000) * 1000
  return asUtcMillis({ ...fieldsAt(whole, zone), millisecond: 0 }) - whole
}

/**
 * Every instant at which a zone's clocks read the given wall-clock time
 *
 * @remarks
 * Offsets are sampled a day either side of the target, so both the pre- and post-transition
 * offset are considered, and each candidate is verified by formatting it back. That yields
 * exactly the instants that really exist: two across a daylight-saving fall-back, none inside
 * a spring-forward gap, one everywhere else.
 */
const instantsFor = (local: LocalDateTime, zone: TimeZone): number[] => {
  const wall = asUtcMillis(local)
  const before = offsetAt(wall - MS_PER_DAY, zone)
  const after = offsetAt(wall + MS_PER_DAY, zone)

  const candidates =
    before === after ? [wall - before] : [wall - before, wall - after]

  return candidates
    .filter((candidate) => asUtcMillis(fieldsAt(candidate, zone)) === wall)
    .sort((left, right) => left - right)
}

/**
 * Canonical spelling of a time zone identifier, or null when it is not a usable named zone
 *
 * @remarks
 * `resolvedOptions` echoes a fixed offset straight back, which is how those are detected and
 * rejected. Reading the resolved value is also what keeps this from constructing a formatter
 * purely for its throwing behaviour.
 */
const canonical = (value: string): string | null => {
  let resolved: string
  try {
    resolved = new Intl.DateTimeFormat('en-US', {
      timeZone: value,
    }).resolvedOptions().timeZone
  } catch {
    return null
  }
  return /^[+-]/.test(resolved) ? null : resolved
}

/**
 * IANA time zone identifiers
 */
export const TimeZone = {
  is: (value: unknown): value is TimeZone =>
    typeof value === 'string' && canonical(value) !== null,

  /**
   * Validate an identifier and canonicalise its spelling
   *
   * @remarks
   * `Intl` resolves aliases and casing, so `europe/oslo` is stored as `Europe/Oslo` and
   * compares equal to it. Fixed offsets such as `+02:00` are rejected.
   *
   * @throws RangeError when the identifier is not a named zone this runtime knows
   */
  parse: (value: string): TimeZone => {
    const zone = canonical(value)
    if (zone === null)
      throw new RangeError(`Not a named IANA time zone: ${value}`)
    return zone as TimeZone
  },

  tryParse: (value: string): TimeZone | null =>
    canonical(value) as TimeZone | null,

  /**
   * The zone the current runtime is configured for
   *
   * @remarks
   * Meaningful in the browser, where it is the user's own zone. On the server it is the
   * container's zone and says nothing about any user, so resolve the viewer's zone on the
   * client and pass it in rather than calling this in server code.
   */
  current: (): TimeZone =>
    Intl.DateTimeFormat().resolvedOptions().timeZone as TimeZone,
} as const

/**
 * Translation between UTC instants and the wall-clock time a user reads
 *
 * @remarks
 * Every function takes the zone explicitly, so its result depends only on its arguments and
 * never on `TZ`, the container, or the browser. That is what makes this testable: the same
 * inputs must produce the same outputs on every machine.
 */
export const Zone = {
  /**
   * The zone's offset from UTC at an instant, in minutes east of UTC
   *
   * @remarks
   * Not a constant per zone. Oslo is +60 in January and +120 in July.
   */
  offsetMinutes: (instant: ISO8601String, zone: TimeZone): number =>
    offsetAt(Instant.toDate(instant).getTime(), zone) / MS_PER_MINUTE,

  /**
   * Split an instant into the wall-clock fields shown in a zone
   */
  toLocal: (instant: ISO8601String, zone: TimeZone): LocalDateTime =>
    fieldsAt(Instant.toDate(instant).getTime(), zone),

  /**
   * All instants matching a wall-clock time, earliest first
   *
   * @returns Two entries when the clocks repeat that hour, none when they skip it, otherwise one
   */
  instantsFor: (local: LocalDateTime, zone: TimeZone): ISO8601String[] =>
    instantsFor(local, zone).map((millis) => Instant.of(new Date(millis))),

  /**
   * Resolve a wall-clock time entered by a user to the UTC instant to store
   *
   * @remarks
   * When a zone repeats an hour leaving daylight saving, the earlier instant is chosen. When
   * it skips an hour, no instant exists and this throws rather than inventing one — surface
   * that to the user, whose input names a time their own clocks never showed.
   *
   * @throws RangeError when the local time does not occur in the zone
   */
  fromLocal: (local: LocalDateTime, zone: TimeZone): ISO8601String => {
    const [earliest] = Zone.instantsFor(local, zone)
    if (!earliest) {
      const { year, month, day, hour, minute } = local
      throw new RangeError(
        `${year}-${month}-${day} ${hour}:${minute} does not exist in ${zone}`,
      )
    }
    return earliest
  },

  /**
   * Read the value of an `<input type="datetime-local">` as a UTC instant
   *
   * @param value Wall-clock input, `YYYY-MM-DDTHH:mm` with optional seconds and milliseconds
   * @param zone The zone the user entered the time in
   *
   * @throws RangeError when the value is malformed or names a time the zone skips
   */
  fromInput: (value: string, zone: TimeZone): ISO8601String => {
    const parts =
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(
        value,
      )
    if (!parts) throw new RangeError(`Not a datetime-local value: ${value}`)

    const [, year, month, day, hour, minute, second, fraction] = parts
    return Zone.fromLocal(
      {
        year: Number(year),
        month: Number(month),
        day: Number(day),
        hour: Number(hour),
        minute: Number(minute),
        second: Number(second ?? 0),
        millisecond: Number((fraction ?? '').padEnd(3, '0') || 0),
      },
      zone,
    )
  },

  /**
   * Render an instant as an `<input type="datetime-local">` value
   */
  toInput: (instant: ISO8601String, zone: TimeZone): string => {
    const { year, month, day, hour, minute } = Zone.toLocal(instant, zone)
    const pad = (value: number, width = 2) => String(value).padStart(width, '0')
    return `${pad(year, 4)}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}`
  },

  /**
   * Format an instant for display in a zone
   *
   * @remarks
   * A thin pass-through to `Intl.DateTimeFormat` that forces `timeZone` to be supplied, so a
   * timestamp can never be rendered in the host's zone by omission.
   */
  format: (
    instant: ISO8601String,
    zone: TimeZone,
    locale: string,
    options: Intl.DateTimeFormatOptions = {
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  ): string =>
    new Intl.DateTimeFormat(locale, { ...options, timeZone: zone }).format(
      Instant.toDate(instant),
    ),
} as const
