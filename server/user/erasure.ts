/**
 * Removes everything stored about users: their résumé files, their place on every event,
 * their profile and their account
 *
 * @remarks
 * Every step can run again after a failure without harm, and the account goes last, so a
 * deletion that stopped halfway can simply be repeated. Leaving an upcoming event moves the first
 * person in its queue into the freed spot, as opting out does; past events just lose the entry.
 */
import type { Auth } from 'firebase-admin/auth'
import type { Database } from 'firebase-admin/database'
import { Instant, TimeZone, Zone } from '@/domain/time'

/** The parts of a Storage bucket erasure uses */
export interface Files {
  deleteFiles(options: { prefix: string }): Promise<unknown>
}

interface StoredEvent {
  capacity?: number | null
  date?: { start?: string }
  attendants?: Record<string, { attended?: boolean; registeredAt?: number }>
  queue?: Record<string, string>
}

const OSLO = TimeZone.parse('Europe/Oslo')

export async function eraseUsers(
  stores: {
    db: Pick<Database, 'ref'>
    files: Files
    auth: Pick<Auth, 'deleteUsers'>
  },
  uids: readonly string[],
  now: Instant = Instant.now(),
): Promise<void> {
  const erased = new Set(uids)

  await Promise.all(
    uids.map((uid) => stores.files.deleteFiles({ prefix: `users/${uid}/` })),
  )

  const events = ((await stores.db.ref('events').once('value')).val() ??
    {}) as Record<string, StoredEvent>
  const today = Zone.toInput(now, OSLO)
  const affected = Object.entries(events)
    .filter(([, event]) => onEvent(event, erased))
    .map(([eventUID]) => eventUID)

  for (const eventUID of affected) {
    await stores.db
      .ref(`events/${eventUID}`)
      .transaction(
        (current: StoredEvent | null) =>
          current && withoutUsers(current, erased, today, now),
      )
  }

  await stores.db
    .ref('users')
    .update(Object.fromEntries(uids.map((uid) => [uid, null])))

  await stores.auth.deleteUsers([...uids])
}

const onEvent = (event: StoredEvent, uids: ReadonlySet<string>) =>
  Object.keys(event.attendants ?? {}).some((uid) => uids.has(uid)) ||
  Object.values(event.queue ?? {}).some((uid) => uids.has(uid))

/** The event with the users removed, promoting from the queue if it has not started */
function withoutUsers(
  event: StoredEvent,
  uids: ReadonlySet<string>,
  today: string,
  now: Instant,
): StoredEvent {
  const attendants = Object.fromEntries(
    Object.entries(event.attendants ?? {}).filter(([uid]) => !uids.has(uid)),
  )
  const queue = Object.entries(event.queue ?? {})
    .filter(([, uid]) => !uids.has(uid))
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))

  // Fill only the spots the erased users held, and only while the event is under its limit,
  // which may have been lowered since people registered
  const freed =
    Object.keys(event.attendants ?? {}).length - Object.keys(attendants).length
  const room = Math.max(
    0,
    (event.capacity ?? 0) - Object.keys(attendants).length,
  )
  const upcoming = (event.date?.start ?? '') > today
  if (upcoming) {
    for (const [, uid] of queue.splice(0, Math.min(freed, room))) {
      attendants[uid] = {
        attended: false,
        registeredAt: Instant.toDate(now).getTime(),
      }
    }
  }

  return { ...event, attendants, queue: Object.fromEntries(queue) }
}
