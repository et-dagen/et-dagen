import { instantOf } from '@/lib/admin/time'
import type { EventRow } from '@/lib/admin/events'
import type { ISO8601String } from '@/domain/time'

/** How far ahead the header looks; past that, the next event is not news yet */
const LOOKAHEAD_MS = 7 * 24 * 60 * 60 * 1000

export type NextUp =
  | { kind: 'now'; uid: string; event: EventRow }
  | { kind: 'next'; uid: string; event: EventRow; today: boolean }

const osloDay = (at: number) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Oslo' }).format(at)

/**
 * What the header's pill names: the event on now, else the next one within a week, else nothing
 *
 * @remarks
 * Outside the fair weeks this is usually nothing, so the pill only shows when it has news.
 */
export function nextUp(
  events: Record<string, EventRow> | null | undefined,
  now: ISO8601String,
): NextUp | null {
  const t = Date.parse(now)
  const timed = Object.entries(events ?? {}).flatMap(([uid, event]) => {
    const start = instantOf(event.date?.start)
    if (!start) return []
    const end = instantOf(event.date?.end)
    return [
      { uid, event, start: Date.parse(start), end: end && Date.parse(end) },
    ]
  })
  timed.sort((a, b) => a.start - b.start)

  const running = timed.find(
    (item) => item.start <= t && item.end !== null && t < item.end,
  )
  if (running) return { kind: 'now', uid: running.uid, event: running.event }

  const next = timed.find(
    (item) => item.start > t && item.start - t <= LOOKAHEAD_MS,
  )
  return next
    ? {
        kind: 'next',
        uid: next.uid,
        event: next.event,
        today: osloDay(next.start) === osloDay(t),
      }
    : null
}
