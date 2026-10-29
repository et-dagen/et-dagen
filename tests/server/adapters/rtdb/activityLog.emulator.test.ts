/**
 * Runs the ActivityLog contract against the Realtime Database emulator
 *
 * Needs `FIREBASE_DATABASE_EMULATOR_HOST`, which `bun run test:api` sets; skipped without it.
 */
import { initializeApp } from 'firebase-admin/app'
import { getDatabase } from 'firebase-admin/database'
import { describe } from 'vitest'
import { describeActivityLog } from '@/tests/application/activity/activityLog.contract'
import { rtdbActivityLog } from '@/server/adapters/rtdb/activityLog'

const host = process.env.FIREBASE_DATABASE_EMULATOR_HOST

describe.skipIf(!host)('Realtime Database emulator', () => {
  const db = getDatabase(
    initializeApp(
      {
        projectId: 'demo-et-dagen',
        databaseURL: `http://${host}?ns=demo-et-dagen-default-rtdb`,
      },
      'activity-log-contract',
    ),
  )

  describeActivityLog('rtdb', async () => {
    await db.ref('activity').remove()
    return rtdbActivityLog(db)
  })
})
