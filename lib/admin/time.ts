import { Instant, TimeZone, Zone, type ISO8601String } from '@/domain/time'

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
  if (!instant) return ''
  return new Intl.DateTimeFormat(locale, {
    ...options,
    timeZone: 'Europe/Oslo',
  }).format(Instant.toDate(instant))
}

/** Whole calendar days in Oslo from now until a stored time; negative once it has passed */
export function daysUntil(
  value: string | undefined,
  now: ISO8601String,
): number | null {
  const instant = instantOf(value)
  if (!instant) return null
  const day = (at: ISO8601String) => Zone.toInput(at, OSLO).slice(0, 10)
  const ms = Date.parse(day(instant)) - Date.parse(day(now))
  return Math.round(ms / 86_400_000)
}
