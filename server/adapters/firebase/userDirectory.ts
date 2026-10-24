import type { Auth } from 'firebase-admin/auth'
import type { UserDirectory } from '@/application/users/userDirectory'

/** Accounts as Firebase Auth knows them */
export const firebaseUserDirectory = (
  auth: Pick<Auth, 'getUser'>,
): UserDirectory => ({
  exists: (uid) =>
    auth.getUser(uid).then(
      () => true,
      (error: { code?: string }) => {
        if (error.code === 'auth/user-not-found') return false
        throw error
      },
    ),
})
