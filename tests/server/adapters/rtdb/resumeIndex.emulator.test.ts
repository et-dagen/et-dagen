/**
 * Runs the ResumeIndex contract against the Realtime Database emulator
 *
 * Needs `FIREBASE_DATABASE_EMULATOR_HOST`, which `bun run test:api` sets; skipped without it.
 */
import { initializeApp } from 'firebase-admin/app'
import { getDatabase } from 'firebase-admin/database'
import { describe } from 'vitest'
import { describeResumeIndex } from '@/tests/application/users/resumeIndex.contract'
import { rtdbResumeIndex } from '@/server/adapters/rtdb/resumeIndex'

const host = process.env.FIREBASE_DATABASE_EMULATOR_HOST

describe.skipIf(!host)('Realtime Database emulator', () => {
  const db = getDatabase(
    initializeApp(
      {
        projectId: 'demo-et-dagen',
        databaseURL: `http://${host}?ns=demo-et-dagen-default-rtdb`,
      },
      'resume-index-contract',
    ),
  )

  describeResumeIndex('rtdb', async (seed = {}, profiles = {}) => {
    const stored = (uid: string, resume: string) => {
      const profile = profiles[uid]
      // v1 stored some study years as strings
      return profile
        ? { ...profile, currentYear: String(profile.currentYear), resume }
        : { name: uid, resume }
    }
    await db
      .ref('users')
      .set(
        Object.fromEntries(
          Object.entries(seed).map(([uid, resume]) => [
            uid,
            stored(uid, resume),
          ]),
        ),
      )
    return rtdbResumeIndex(db)
  })
})
