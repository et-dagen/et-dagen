import { eventStatus, isUpcoming, type EventRow } from '@/lib/admin/events'
import { instantOf } from '@/lib/admin/time'
import { Instant, type ISO8601String } from '@/domain/time'

/** `generalInfo` as the landing page reads it; the fair's days as Oslo wall-clock times */
export interface GeneralInfo {
  date?: { start?: string; end?: string }
}

/** The fair's days as the landing page sets them: "9.–10." over "februar 2027" */
export interface FairDays {
  days: string
  month: string
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
 * The fair's days, split so the day numbers can be set larger than the month
 *
 * @remarks
 * Norwegian writes ordinal days with a point ("9.–10."); English does not ("9–10"). A fair that
 * crosses a month names the first month with its day.
 *
 * @returns null when no dates are set or the fair is over, so the page can say the date is coming
 */
export function fairDays(
  info: GeneralInfo | null | undefined,
  locale: string,
  now: ISO8601String,
): FairDays | null {
  const start = instantOf(info?.date?.start)
  const end = instantOf(info?.date?.end) ?? start
  if (!start || !end || Instant.compare(end, now) < 0) return null

  const dot = /^(nb|nn|no)\b/.test(locale) ? '.' : ''
  const day = (at: ISO8601String) =>
    `${part(at, locale, { day: 'numeric' })}${dot}`
  const month = (at: ISO8601String) => part(at, locale, { month: 'long' })
  const year = part(end, locale, { year: 'numeric' })

  const first = day(start)
  const last = day(end)
  const days =
    first === last && month(start) === month(end)
      ? first
      : month(start) === month(end)
        ? `${first}–${last}`
        : `${first} ${month(start)}–${last}`
  return { days, month: `${month(end)} ${year}` }
}

export interface Upcoming {
  uid: string
  event: EventRow
}

/** The next events that have not finished, soonest first, for the landing page's short list */
export function upcoming(
  events: Record<string, EventRow> | null | undefined,
  now: ISO8601String,
  limit: number,
): Upcoming[] {
  return Object.entries(events ?? {})
    .flatMap(([uid, event]) => {
      const start = instantOf(event.date?.start)
      return start && isUpcoming(event, now) ? [{ uid, event, start }] : []
    })
    .sort((a, b) => Instant.compare(a.start, b.start))
    .slice(0, limit)
    .map(({ uid, event }) => ({ uid, event }))
}

/** Free places left, or null when the event takes no sign-ups */
export function placesLeft(event: EventRow, now: ISO8601String): number | null {
  const status = eventStatus(event, now)
  if (status.kind !== 'open') return null
  return (event.capacity ?? 0) - Object.keys(event.attendants ?? {}).length
}
