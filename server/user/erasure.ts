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
import { Instant } from '@/domain/time'
import { UserUid } from '@/domain/user'
import { rtdbEventRepository } from '@/server/adapters/rtdb/eventRepository'

/** The parts of a Storage bucket erasure uses */
export interface Files {
  deleteFiles(options: { prefix: string }): Promise<unknown>
}

export async function eraseUsers(
  stores: {
    db: Pick<Database, 'ref'>
    files: Files
    auth: Pick<Auth, 'deleteUsers'>
  },
  uids: readonly string[],
  now: Instant = Instant.now(),
): Promise<void> {
  await Promise.all(
    uids.map((uid) => stores.files.deleteFiles({ prefix: `users/${uid}/` })),
  )

  await rtdbEventRepository(stores.db).removeUsers(
    uids.map((uid) => UserUid.parse(uid)),
    now,
  )

  await stores.db
    .ref('users')
    .update(Object.fromEntries(uids.map((uid) => [uid, null])))

  await stores.auth.deleteUsers([...uids])
}
