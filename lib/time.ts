import { TimeZone, Zone, type ISO8601String } from '@/domain/time'

/** v1 stores every time as Norwegian wall-clock time */
const OSLO = TimeZone.parse('Europe/Oslo')

/** The instant of a stored wall-clock time, or null when it is missing or malformed */
export function instantOf(value: string | undefined): ISO8601String | null {
  if (!value) return null
  try {
    return Zone.fromInput(value, OSLO)
  } catch {
    return null
  }
}

/**
 * A deadline as a wall-clock time: v1 has stored deadlines both as dates and as date-times, and a
 * date means the end of that day
 */
export const deadlineOf = (value: string | undefined) =>
  value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T23:59` : value

/** A stored wall-clock time as people read it in Oslo, such as "ons. 4. nov. 2026, 17:15" */
export function formatWhen(
  value: string | undefined,
  locale: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  },
): string {
  const instant = instantOf(value)
  return instant ? formatInstant(instant, locale, options) : ''
}

/** An instant as people read it in Oslo */
export const formatInstant = (
  instant: ISO8601String,
  locale: string,
  options: Intl.DateTimeFormatOptions,
): string => Zone.format(instant, OSLO, locale, options)

/** The Oslo calendar day of an instant, as `YYYY-MM-DD` */
export const osloDay = (instant: ISO8601String): string =>
  Zone.toInput(instant, OSLO).slice(0, 10)

/**
 * A calendar day (`YYYY-MM-DD`) as people read it, such as "onsdag 4. november"
 *
 * @remarks
 * A day is the same date in every zone, so it is read at noon UTC and shown in UTC, which keeps the
 * date from shifting wherever the code runs.
 */
export const formatDay = (
  day: string,
  locale: string,
  options: Intl.DateTimeFormatOptions,
): string =>
  new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(
    new Date(`${day}T12:00:00Z`),
  )

/** Whole calendar days in Oslo from now until a stored time; negative once it has passed */
export function daysUntil(
  value: string | undefined,
  now: ISO8601String,
): number | null {
  const instant = instantOf(value)
  if (!instant) return null
  const ms = Date.parse(osloDay(instant)) - Date.parse(osloDay(now))
  return Math.round(ms / 86_400_000)
}
