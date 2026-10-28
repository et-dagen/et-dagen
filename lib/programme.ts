import { instantOf } from '@/lib/admin/time'
import type { EventRow } from '@/lib/admin/events'
import { Instant, type ISO8601String } from '@/domain/time'

/** An event as the programme lists it */
export type ProgrammeEvent = EventRow & { uid: string }

export interface ProgrammeDay {
  /** `YYYY-MM-DD` in Oslo */
  date: string
  events: ProgrammeEvent[]
  /** Where each event starts within the day's hours, 0 to 1, for the day card's track */
  track: number[]
}

/** The hours a day card's track spans; events outside it sit at the ends */
const FIRST_HOUR = 8
const LAST_HOUR = 22

const osloDate = (at: ISO8601String) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Oslo' }).format(
    Instant.toDate(at),
  )

/** The days that have events, in order, each with its events by start time */
export function programmeDays(
  events: Record<string, EventRow> | null | undefined,
): ProgrammeDay[] {
  const byDay = new Map<string, ProgrammeEvent[]>()
  for (const [uid, event] of Object.entries(events ?? {})) {
    const start = instantOf(event.date?.start)
    if (!start) continue
    const date = osloDate(start)
    byDay.set(date, [...(byDay.get(date) ?? []), { ...event, uid }])
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, list]) => {
      const sorted = list.sort((a, b) =>
        (a.date?.start ?? '').localeCompare(b.date?.start ?? ''),
      )
      const track = sorted.map((event) => {
        const [hours, minutes] = (event.date?.start ?? 'T00:00')
          .split('T')[1]!
          .split(':')
          .map(Number)
        const at = (hours ?? 0) + (minutes ?? 0) / 60
        const span = LAST_HOUR - FIRST_HOUR
        return Math.min(1, Math.max(0, (at - FIRST_HOUR) / span))
      })
      return { date, events: sorted, track }
    })
}

/** What is on right now, and the next event to start, across all days */
export function nowAndNext(
  days: readonly ProgrammeDay[],
  now: ISO8601String,
): { now: ProgrammeEvent[]; next: ProgrammeEvent | null } {
  const all = days.flatMap((day) => day.events)
  const t = Date.parse(now)
  const running = all.filter((event) => {
    const start = instantOf(event.date?.start)
    const end = instantOf(event.date?.end)
    return !!start && !!end && Date.parse(start) <= t && t < Date.parse(end)
  })
  const next =
    all.find((event) => {
      const start = instantOf(event.date?.start)
      return !!start && Date.parse(start) > t
    }) ?? null
  return { now: running, next }
}

/** The day to open on: today, else the next day with events, else the last one */
export function initialDay(
  days: readonly ProgrammeDay[],
  now: ISO8601String,
): string | null {
  const today = osloDate(now)
  return (
    days.find((day) => day.date >= today)?.date ?? days.at(-1)?.date ?? null
  )
}

/** Whether an event has finished by now, so the timeline can fade it */
export function isOver(event: EventRow, now: ISO8601String): boolean {
  const end = instantOf(event.date?.end) ?? instantOf(event.date?.start)
  return !!end && Date.parse(end) < Date.parse(now)
}

/** Each day's stand map, from the list the stand map endpoint returns */
export const standMapsByDay = (
  maps: readonly { date: string; url: string }[] | null | undefined,
) => new Map((maps ?? []).map((map) => [map.date, map.url]))

/**
 * The days to list: today and later, or every day when nothing is coming up, so the page shows
 * last year's programme until the next one is published
 */
export function upcomingDays(
  days: readonly ProgrammeDay[],
  now: ISO8601String,
): ProgrammeDay[] {
  const today = osloDate(now)
  const coming = days.filter((day) => day.date >= today)
  return coming.length ? coming : [...days]
}
