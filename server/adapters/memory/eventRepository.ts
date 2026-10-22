import type {
  EventRepository,
  StoredEvent,
} from '@/application/events/eventRepository'
import type { EventUid } from '@/domain/event/event'
import { register, withdraw } from '@/domain/event/roster'

/**
 * Events held in a map, for tests and local work
 *
 * @remarks
 * JavaScript runs each operation to completion before the next starts, so a synchronous
 * read-modify-write here is as atomic as a database transaction.
 */
export function memoryEventRepository(
  seed: readonly StoredEvent[] = [],
): EventRepository {
  const events = new Map<EventUid, StoredEvent>(
    seed.map((stored) => [stored.event.uid, stored]),
  )

  return {
    find: (uid) => Promise.resolve(events.get(uid) ?? null),

    registerOrQueue: (uid, user, at) => {
      const stored = events.get(uid)
      if (!stored) return Promise.resolve({ kind: 'event-not-found' })
      const { registration } = stored.event
      if (!registration) return Promise.resolve({ kind: 'no-registration' })

      const next = register(stored.roster, registration, user, at)
      events.set(uid, { ...stored, roster: next.roster })
      return Promise.resolve(next.outcome)
    },

    withdraw: (uid, user, at) => {
      const stored = events.get(uid)
      if (!stored) return Promise.resolve({ kind: 'event-not-found' })
      const { registration } = stored.event
      if (!registration) return Promise.resolve({ kind: 'no-registration' })

      const next = withdraw(stored.roster, registration, user, at)
      events.set(uid, { ...stored, roster: next.roster })
      return Promise.resolve(next.outcome)
    },
  }
}
