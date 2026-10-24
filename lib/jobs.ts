import { deadlineOf, daysUntil, formatWhen, instantOf } from '@/lib/admin/time'
import { isUpcoming, type EventRow } from '@/lib/admin/events'
import { Instant, type ISO8601String } from '@/domain/time'

/** Deadlines this many days away or closer are marked, so students apply in time */
export const SOON_DAYS = 14

export type DeadlineState =
  | { kind: 'none' }
  | { kind: 'passed' }
  | { kind: 'open'; days: number; soon: boolean }

/** Where a job's application deadline stands at a moment, counted in Oslo calendar days */
export function deadlineState(
  deadline: string | undefined,
  now: ISO8601String,
): DeadlineState {
  const at = deadlineOf(deadline)
  const instant = instantOf(at)
  const days = daysUntil(at, now)
  if (!instant || days === null) return { kind: 'none' }
  if (Instant.compare(instant, now) < 0) return { kind: 'passed' }
  return { kind: 'open', days, soon: days <= SOON_DAYS }
}

/** A deadline as a date, with the time only when it is not the end of the day */
export function formatDeadline(
  deadline: string | undefined,
  locale: string,
): string {
  const at = deadlineOf(deadline)
  const endOfDay = !at || at.endsWith('T23:59')
  return formatWhen(at, locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(endOfDay ? {} : { hour: '2-digit', minute: '2-digit' }),
  })
}

/** A deadline as a list reads it, "3. nov.", with the year only when it is not this year's */
export function formatShortDeadline(
  deadline: string | undefined,
  locale: string,
  now: Date = new Date(),
): string {
  const at = deadlineOf(deadline)
  const year = at?.slice(0, 4)
  return formatWhen(at, locale, {
    day: 'numeric',
    month: 'short',
    ...(year && year !== String(now.getFullYear()) ? { year: 'numeric' } : {}),
  })
}

export type FairEvent = EventRow & { uid: string }

/** A company's events at the fair that have not finished, soonest first */
export function fairEventsOf(
  companyUID: string | undefined,
  events: Record<string, EventRow> | null | undefined,
  now: ISO8601String,
): FairEvent[] {
  if (!companyUID) return []
  return Object.entries(events ?? {})
    .filter(([, event]) => event.companyUID === companyUID)
    .filter(([, event]) => isUpcoming(event, now))
    .map(([uid, event]) => ({ ...event, uid }))
    .sort((a, b) => (a.date?.start ?? '').localeCompare(b.date?.start ?? ''))
}

/** Whether an event starts after the job's deadline, so meeting the company there is too late */
export function afterDeadline(
  event: EventRow,
  deadline: string | undefined,
): boolean {
  const start = instantOf(event.date?.start)
  const closes = instantOf(deadlineOf(deadline))
  return !!start && !!closes && Instant.compare(start, closes) > 0
}
