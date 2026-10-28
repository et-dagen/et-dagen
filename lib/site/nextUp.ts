import { instantOf } from '@/lib/admin/time'
import type { EventRow } from '@/lib/admin/events'
import type { ISO8601String } from '@/domain/time'

/** How far ahead the header looks for the fair's next event; past that, it is not news yet */
const LOOKAHEAD_MS = 7 * 24 * 60 * 60 * 1000

export interface NextUp {
  kind: 'now' | 'next'
  uid: string
  event: EventRow
  /** The visitor is signed up or queued for it */
  mine: boolean
  /** How far away the start is, for how the time is written */
  when: 'today' | 'week' | 'later'
}

const osloDay = (at: number) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Oslo' }).format(at)

const isMine = (event: EventRow, uid: string) =>
  uid in (event.attendants ?? {}) ||
  Object.values(event.queue ?? {}).includes(uid)

/**
 * What the header's pill names
 *
 * @remarks
 * A signed-in visitor's own events come first, however far ahead: the event they are at, else the
 * next one they are signed up or queued for. Everyone else, and anyone without a sign-up, gets the
 * fair's event on now, else its next one within a week, else nothing.
 */
export function nextUp(
  events: Record<string, EventRow> | null | undefined,
  now: ISO8601String,
  visitor?: string | null,
): NextUp | null {
  const t = Date.parse(now)
  const timed = Object.entries(events ?? {})
    .flatMap(([uid, event]) => {
      const start = instantOf(event.date?.start)
      if (!start) return []
      const end = instantOf(event.date?.end)
      return [
        {
          uid,
          event,
          start: Date.parse(start),
          end: end ? Date.parse(end) : null,
          mine: !!visitor && isMine(event, visitor),
        },
      ]
    })
    .sort((a, b) => a.start - b.start)

  const pick = (items: typeof timed, limit: number): NextUp | null => {
    const running = items.find(
      (item) => item.start <= t && item.end !== null && t < item.end,
    )
    if (running) {
      const { uid, event, mine } = running
      return { uid, event, mine, kind: 'now', when: 'today' }
    }
    const next = items.find((item) => item.start > t && item.start - t <= limit)
    if (!next) return null
    const when =
      osloDay(next.start) === osloDay(t)
        ? 'today'
        : next.start - t <= LOOKAHEAD_MS
          ? 'week'
          : 'later'
    return {
      uid: next.uid,
      event: next.event,
      mine: next.mine,
      kind: 'next',
      when,
    }
  }

  return (
    pick(
      timed.filter((item) => item.mine),
      Infinity,
    ) ?? pick(timed, LOOKAHEAD_MS)
  )
}
