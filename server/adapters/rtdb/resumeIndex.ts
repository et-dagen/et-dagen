import type { Database } from 'firebase-admin/database'
import type { ResumeIndex } from '@/application/users/resumeIndex'

/** The `resume` field of `users/<uid>` in the Realtime Database */
export const rtdbResumeIndex = (db: Pick<Database, 'ref'>): ResumeIndex => ({
  of: async (user) => {
    const value = (await db.ref(`users/${user}/resume`).once('value')).val()
    return typeof value === 'string' && value !== '' ? value : null
  },
  set: async (user, file) => {
    await db.ref(`users/${user}/resume`).set(file)
  },
})
