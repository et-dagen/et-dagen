import type { Database } from 'firebase-admin/database'
import type { UserRepository } from '@/application/users/userRepository'
import { storedUserOf } from '@/server/adapters/rtdb/userRecord'

/** Profiles under `users/<uid>` in the Realtime Database */
export const rtdbUserRepository = (
  db: Pick<Database, 'ref'>,
): UserRepository => ({
  find: async (uid, now) => {
    const [record, roles, memberships] = await Promise.all(
      [`users/${uid}`, `roles/${uid}`, `memberships/${uid}`].map(async (path) =>
        (await db.ref(path).once('value')).val(),
      ),
    )
    return record ? storedUserOf(record, now, { roles, memberships }) : null
  },
  // the profile, and who the user was: their roles and memberships go with them
  remove: async (users) => {
    const gone = Object.fromEntries(users.map((uid) => [uid, null]))
    await Promise.all(
      ['users', 'roles', 'memberships'].map((node) =>
        db.ref(node).update(gone),
      ),
    )
  },
})
