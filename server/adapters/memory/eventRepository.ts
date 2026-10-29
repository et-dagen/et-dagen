import type {
  EventRepository,
  StoredEvent,
} from '@/application/events/eventRepository'
import type { EventUid } from '@/domain/event/event'
import {
  placeOf,
  promoteWaiting,
  register,
  removeUsers,
  withdraw,
} from '@/domain/event/roster'

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

    withUser: (user) =>
      Promise.resolve(
        [...events.values()].filter((stored) => placeOf(stored.roster, user)),
      ),

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

    promoteWaiting: (uid, at) => {
      const stored = events.get(uid)
      if (!stored) return Promise.resolve({ kind: 'event-not-found' })
      const { registration } = stored.event
      if (!registration) return Promise.resolve({ kind: 'no-registration' })

      const next = promoteWaiting(stored.roster, registration, at)
      events.set(uid, { ...stored, roster: next.roster })
      return Promise.resolve(next.outcome)
    },

    removeUsers: (users, at) => {
      const removed = new Set(users)
      for (const [uid, stored] of events) {
        const roster = removeUsers(stored.roster, stored.event, removed, at)
        events.set(uid, { ...stored, roster })
      }
      return Promise.resolve()
    },
  }
}
