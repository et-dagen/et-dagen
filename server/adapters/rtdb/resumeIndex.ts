import type { Database } from 'firebase-admin/database'
import type { ResumeHolder, ResumeIndex } from '@/application/users/resumeIndex'
import { UserUid } from '@/domain/user'

type Profile = Record<string, unknown> | null

const text = (value: unknown) =>
  typeof value === 'string' && value !== '' ? value : null

/** v1 stored the study year as a number or a numeric string */
const year = (value: unknown) => {
  const n = typeof value === 'string' ? Number(value) : value
  return typeof n === 'number' && Number.isInteger(n) ? n : null
}

const holderOf = (uid: string, profile: Profile): ResumeHolder => ({
  uid: UserUid.parse(uid),
  name: text(profile?.name),
  studyProgram: text(profile?.studyProgram),
  currentYear: year(profile?.currentYear),
})

/** The `resume` field of `users/<uid>` in the Realtime Database */
export const rtdbResumeIndex = (db: Pick<Database, 'ref'>): ResumeIndex => ({
  of: async (user) => {
    const value = (await db.ref(`users/${user}/resume`).once('value')).val()
    return typeof value === 'string' && value !== '' ? value : null
  },
  set: async (user, file) => {
    await db.ref(`users/${user}/resume`).set(file)
  },
  holders: async () => {
    const users = ((await db.ref('users').once('value')).val() ?? {}) as Record<
      string,
      Profile
    >
    return Object.entries(users)
      .filter(([, profile]) => text(profile?.resume))
      .map(([uid, profile]) => holderOf(uid, profile))
  },
})
