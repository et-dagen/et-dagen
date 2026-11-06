import { formatWhen, instantOf } from './time'
import { Instant, type ISO8601String } from '@/domain/time'

/** An `events/<uid>` record as the admin list reads it; every field may be missing */
export interface EventRow {
  title?: string
  companyUID?: string
  capacity?: number | null
  date?: { start?: string; end?: string }
  registration?: { start?: string; end?: string } | null
  location?: { name?: string; map?: string }
  attendants?: Record<string, unknown>
  queue?: Record<string, string>
  /** How many attendants have each dietary restriction */
  diets?: Record<string, number>
}

/**
 * Split a place into its building code and the rest, as campus signs show it
 *
 * @example placeOf('EL5, Elektrobygget') // { code: 'EL5', name: 'Elektrobygget' }
 * @returns code null when the name does not start with a room or building code
 */
export function placeOf(name: string | undefined): {
  code: string | null
  name: string
} {
  const match = /^([A-ZÆØÅ]{1,4}\d{1,3})(?:\s*,\s*|\s+|$)(.*)$/.exec(
    (name ?? '').trim(),
  )
  if (!match) return { code: null, name: (name ?? '').trim() }
  return { code: match[1], name: match[2] }
}

export type EventStatus =
  | { kind: 'past' }
  | { kind: 'no-registration' }
  | { kind: 'not-open' }
  | { kind: 'open' }
  | { kind: 'full'; queued: number }
  | { kind: 'closed' }

/** Where an event's sign-up stands at a moment */
export function eventStatus(event: EventRow, now: ISO8601String): EventStatus {
  const end = instantOf(event.date?.end) ?? instantOf(event.date?.start)
  if (end && Instant.compare(end, now) < 0) return { kind: 'past' }
  if (!event.capacity) return { kind: 'no-registration' }

  const opens = instantOf(event.registration?.start)
  const closes = instantOf(event.registration?.end)
  if (opens && Instant.compare(now, opens) < 0) return { kind: 'not-open' }
  if (closes && Instant.compare(closes, now) < 0) return { kind: 'closed' }

  const attending = Object.keys(event.attendants ?? {}).length
  if (attending >= event.capacity) {
    return { kind: 'full', queued: Object.keys(event.queue ?? {}).length }
  }
  return { kind: 'open' }
}

/** Whether an event has not finished yet */
export const isUpcoming = (event: EventRow, now: ISO8601String) =>
  eventStatus(event, now).kind !== 'past'

/** An event's start as people read it, such as "ons. 4. nov. 2026, 17:15", in Oslo time */
export const formatStart = (event: EventRow, locale: string): string =>
  formatWhen(event.date?.start, locale)
