/**
 * Runs the JobRepository contract against the Realtime Database emulator
 *
 * Needs `FIREBASE_DATABASE_EMULATOR_HOST`, which `bun run test:api` sets; skipped without it.
 */
import { initializeApp } from 'firebase-admin/app'
import { getDatabase } from 'firebase-admin/database'
import { describe } from 'vitest'
import { describeJobRepository } from '@/tests/application/jobs/jobRepository.contract'
import { rtdbJobRepository } from '@/server/adapters/rtdb/jobRepository'

const host = process.env.FIREBASE_DATABASE_EMULATOR_HOST

describe.skipIf(!host)('Realtime Database emulator', () => {
  const db = getDatabase(
    initializeApp(
      {
        projectId: 'demo-et-dagen',
        databaseURL: `http://${host}?ns=demo-et-dagen-default-rtdb`,
      },
      'job-repository-contract',
    ),
  )

  describeJobRepository('rtdb', async (seed = {}) => {
    await db.ref('jobs').set(seed)
    return rtdbJobRepository(db)
  })
})
