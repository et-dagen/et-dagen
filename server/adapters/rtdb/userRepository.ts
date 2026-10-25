import type { Database } from 'firebase-admin/database'
import type { UserRepository } from '@/application/users/userRepository'
import { storedUserOf } from '@/server/adapters/rtdb/userRecord'

/** Profiles under `users/<uid>` in the Realtime Database */
export const rtdbUserRepository = (
  db: Pick<Database, 'ref'>,
): UserRepository => ({
  find: async (uid, now) => {
    const record = (await db.ref(`users/${uid}`).once('value')).val()
    return record ? storedUserOf(record, now) : null
  },
  remove: async (users) => {
    await db
      .ref('users')
      .update(Object.fromEntries(users.map((uid) => [uid, null])))
  },
})
