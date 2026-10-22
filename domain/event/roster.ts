import type { AttendantMetadata } from '@/domain/event/attendance'
import { hasSpots, type Registration } from '@/domain/event/registration'
import type { ISO8601String } from '@/domain/time'
import type { UserUid } from '@/domain/user'

/**
 * Who is coming to an event, and who is waiting for a spot
 *
 * @remarks
 * The queue is ordered: the first entry gets the next spot that frees up. Only
 * {@link register} and {@link withdraw} change a roster, so capacity and queue order hold
 * whichever adapter stores it.
 */
export interface Roster {
  readonly attendants: ReadonlyMap<UserUid, AttendantMetadata>
  readonly queue: readonly UserUid[]
}

export const emptyRoster = (): Roster => ({ attendants: new Map(), queue: [] })

export type RegisterOutcome =
  | { kind: 'registered' }
  /** `position` counts from 1 */
  | { kind: 'queued'; position: number }
  | { kind: 'already-registered' }
  | { kind: 'already-queued' }

export type WithdrawOutcome =
  /** `promoted` is the user who took the freed spot, if anyone was waiting */
  | { kind: 'withdrawn'; promoted: UserUid | null }
  | { kind: 'dequeued' }
  | { kind: 'not-registered' }

const attending = (at: ISO8601String): AttendantMetadata => ({
  attended: false,
  registeredAt: at,
})

/**
 * Give a user a spot, or a place in the queue when the event is full
 *
 * @remarks
 * Deliberately says nothing about the registration window or eligibility: those are decided
 * before asking, from the request. This decides only what depends on the roster, which is what
 * an adapter must apply atomically.
 */
export function register(
  roster: Roster,
  registration: Pick<Registration, 'attendanceLimit'>,
  user: UserUid,
  at: ISO8601String,
): { roster: Roster; outcome: RegisterOutcome } {
  if (roster.attendants.has(user)) {
    return { roster, outcome: { kind: 'already-registered' } }
  }
  if (roster.queue.includes(user)) {
    return { roster, outcome: { kind: 'already-queued' } }
  }
  if (hasSpots(registration, roster.attendants.size)) {
    const attendants = new Map(roster.attendants).set(user, attending(at))
    return {
      roster: { ...roster, attendants },
      outcome: { kind: 'registered' },
    }
  }
  const queue = [...roster.queue, user]
  return {
    roster: { ...roster, queue },
    outcome: { kind: 'queued', position: queue.length },
  }
}

/**
 * Take a user off the event, moving the first in the queue into the freed spot
 *
 * @remarks
 * Nobody is promoted while the event is still full, which happens when the limit was lowered after
 * people registered.
 */
export function withdraw(
  roster: Roster,
  registration: Pick<Registration, 'attendanceLimit'>,
  user: UserUid,
  at: ISO8601String,
): { roster: Roster; outcome: WithdrawOutcome } {
  if (roster.queue.includes(user)) {
    const queue = roster.queue.filter((queued) => queued !== user)
    return { roster: { ...roster, queue }, outcome: { kind: 'dequeued' } }
  }
  if (!roster.attendants.has(user)) {
    return { roster, outcome: { kind: 'not-registered' } }
  }

  const attendants = new Map(roster.attendants)
  attendants.delete(user)
  if (roster.queue.length === 0 || !hasSpots(registration, attendants.size)) {
    return {
      roster: { ...roster, attendants },
      outcome: { kind: 'withdrawn', promoted: null },
    }
  }
  const [promoted, ...queue] = roster.queue
  attendants.set(promoted, attending(at))
  return {
    roster: { attendants, queue },
    outcome: { kind: 'withdrawn', promoted },
  }
}
