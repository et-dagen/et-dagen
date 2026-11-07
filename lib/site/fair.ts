import { instantOf } from '@/lib/time'
import type { ISO8601String } from '@/domain/time'

/** `generalInfo` as the landing page reads it; the fair's days as Oslo wall-clock times */
export interface GeneralInfo {
  date?: { start?: string; end?: string }
}

const part = (
  at: ISO8601String,
  locale: string,
  options: Intl.DateTimeFormatOptions,
) =>
  new Intl.DateTimeFormat(locale, { ...options, timeZone: 'Europe/Oslo' })
    .formatToParts(new Date(at))
    .find((p) => p.type !== 'literal')?.value ?? ''

/**
 * The fair's days as the banner sets them, such as "9. - 10. februar"
 *
 * @remarks
 * The first month is named only when the fair crosses one.
 *
 * @returns null when no dates are set
 */
export function fairDateLine(
  info: GeneralInfo | null | undefined,
  locale: string,
): string | null {
  const start = instantOf(info?.date?.start)
  const end = instantOf(info?.date?.end) ?? start
  if (!start || !end) return null

  const day = (at: ISO8601String) => part(at, locale, { day: 'numeric' })
  const month = (at: ISO8601String) => part(at, locale, { month: 'long' })
  const year = (at: ISO8601String) => part(at, locale, { year: 'numeric' })
  const sameMonth = month(start) === month(end) && year(start) === year(end)
  return [
    `${day(start)}.`,
    sameMonth ? '' : month(start),
    '-',
    `${day(end)}.`,
    month(end),
  ]
    .filter(Boolean)
    .join(' ')
}

/** Whole days, hours, minutes and seconds */
export interface Countdown {
  days: number
  hours: number
  minutes: number
  seconds: number
}

/** How long until `at`, rounded down to the second; all zero once it has passed */
export function timeUntil(at: ISO8601String, now: ISO8601String): Countdown {
  const total = Math.max(
    0,
    Math.floor((Date.parse(at) - Date.parse(now)) / 1000),
  )
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  }
}
