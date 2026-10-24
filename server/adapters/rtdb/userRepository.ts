import type { Database } from 'firebase-admin/database'
import type { UserRepository } from '@/application/users/userRepository'

/** Profiles under `users/<uid>` in the Realtime Database */
export const rtdbUserRepository = (
  db: Pick<Database, 'ref'>,
): UserRepository => ({
  remove: async (users) => {
    await db
      .ref('users')
      .update(Object.fromEntries(users.map((uid) => [uid, null])))
  },
})
