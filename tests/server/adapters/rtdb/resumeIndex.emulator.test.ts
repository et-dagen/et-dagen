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

  describeResumeIndex('rtdb', async (seed = {}) => {
    await db
      .ref('users')
      .set(
        Object.fromEntries(
          Object.entries(seed).map(([uid, resume]) => [
            uid,
            { name: uid, resume },
          ]),
        ),
      )
    return rtdbResumeIndex(db)
  })
})
