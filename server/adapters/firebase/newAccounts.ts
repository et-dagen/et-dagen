import type { Auth } from 'firebase-admin/auth'
import type { Database } from 'firebase-admin/database'
import type { NewAccounts } from '@/application/invitations/newAccounts'
import { Instant } from '@/domain/time'
import { UserUid } from '@/domain/user'

/** Accounts in Firebase Auth, each with an empty profile under `users/` */
export const firebaseNewAccounts = (
  auth: Pick<Auth, 'createUser'>,
  db: Pick<Database, 'ref'>,
): NewAccounts => ({
  open: async ({ email, name, password, now }) => {
    let uid: string
    try {
      ;({ uid } = await auth.createUser({
        email,
        password,
        displayName: name,
        emailVerified: true,
      }))
    } catch (error) {
      if ((error as { code?: string }).code === 'auth/email-already-exists') {
        return null
      }
      throw error
    }
    // the shape `POST /api/v1/user` gives a new company contact
    await db.ref(`users/${uid}`).set({ updated: Instant.toDate(now).getTime() })
    return UserUid.parse(uid)
  },
})
