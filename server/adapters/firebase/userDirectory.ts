import type { Auth } from 'firebase-admin/auth'
import type { UserDirectory } from '@/application/users/userDirectory'

/** Accounts as Firebase Auth knows them */
export const firebaseUserDirectory = (
  auth: Pick<Auth, 'getUser' | 'deleteUsers'>,
): UserDirectory => ({
  exists: (uid) =>
    auth.getUser(uid).then(
      () => true,
      (error: { code?: string }) => {
        if (error.code === 'auth/user-not-found') return false
        throw error
      },
    ),

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
