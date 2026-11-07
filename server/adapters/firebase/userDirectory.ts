import type { Auth } from 'firebase-admin/auth'
import type { Contact, UserDirectory } from '@/application/users/userDirectory'
import { UserUid } from '@/domain/user'

/** The most accounts `getUsers` looks up in one call */
const LOOKUP_LIMIT = 100

/** Accounts as Firebase Auth knows them */
export const firebaseUserDirectory = (
  auth: Pick<Auth, 'getUser' | 'getUsers' | 'deleteUsers'>,
): UserDirectory => ({
  exists: (uid) =>
    auth.getUser(uid).then(
      () => true,
      (error: { code?: string }) => {
        if (error.code === 'auth/user-not-found') return false
        throw error
      },
    ),

  contacts: async (uids) => {
    const contacts = new Map<UserUid, Contact>()
    for (let i = 0; i < uids.length; i += LOOKUP_LIMIT) {
      const { users } = await auth.getUsers(
        uids.slice(i, i + LOOKUP_LIMIT).map((uid) => ({ uid })),
      )
      for (const user of users) {
        contacts.set(UserUid.parse(user.uid), {
          name: user.displayName ?? null,
          email: user.email ?? null,
        })
      }
    }
    return contacts
  },

  remove: async (users) => {
    if (users.length === 0) return
    // deleteUsers reports failures in its result instead of throwing
    const { failureCount, errors } = await auth.deleteUsers([...users])
    if (failureCount > 0) {
      throw new Error(`Could not delete ${failureCount} accounts`, {
        cause: errors,
      })
    }
  },
})
