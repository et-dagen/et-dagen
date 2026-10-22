import type { Database } from 'firebase-admin/database'
import {
  queueOf,
  rosterRecord,
  toStoredEvent,
  type EventRecord,
} from './eventRecord'
import type {
  EventRepository,
  Missing,
} from '@/application/events/eventRepository'
import type { Registration } from '@/domain/event/registration'
import { register, withdraw, type Roster } from '@/domain/event/roster'
import type { ISO8601String } from '@/domain/time'

type Change<T> = (
  roster: Roster,
  registration: Registration,
) => { roster: Roster; outcome: T }

/**
 * Events in the Realtime Database, in the shape v1 reads and writes
 *
 * @remarks
 * Each roster operation is one transaction on `events/<uid>`. The database re-runs the change
 * whenever the node moved underneath it, so two users taking the last spot cannot both get it,
 * whichever server instance they reach.
 */
export function rtdbEventRepository(db: Database): EventRepository {
  const node = (uid: string) => db.ref(`events/${uid}`)

  async function change<T>(
    uid: string,
    at: ISO8601String,
    apply: Change<T>,
  ): Promise<T | Missing> {
    let outcome: T | Missing = { kind: 'event-not-found' }

    await node(uid).transaction(
      (current: EventRecord | null) => {
        // The first attempt may run on an empty local cache. Writing null back is a no-op that
        // makes the database answer with the stored value and run this again.
        if (current === null) {
          outcome = { kind: 'event-not-found' }
          return null
        }
        const { event, roster } = toStoredEvent(uid, current)
        if (!event.registration) {
          outcome = { kind: 'no-registration' }
          return current
        }

        const next = apply(roster, event.registration)
        outcome = next.outcome
        if (next.roster === roster) return current

        const keys = new Map(queueOf(current).map(([key, user]) => [user, key]))
        return { ...current, ...rosterRecord(next.roster, keys, at) }
      },
      undefined,
      false,
    )

    return outcome
  }

  return {
    find: async (uid) => {
      const snapshot = await node(uid).once('value')
      const record = snapshot.val() as EventRecord | null
      return record === null ? null : toStoredEvent(uid, record)
    },

    registerOrQueue: (uid, user, at) =>
      change(uid, at, (roster, registration) =>
        register(roster, registration, user, at),
      ),

    withdraw: (uid, user, at) =>
      change(uid, at, (roster, registration) =>
        withdraw(roster, registration, user, at),
      ),
  }
}
