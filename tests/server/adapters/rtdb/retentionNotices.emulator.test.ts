/**
 * Runs the RetentionNotices contract against the Realtime Database emulator
 *
 * Needs `FIREBASE_DATABASE_EMULATOR_HOST`, which `bun run test:api` sets; skipped without it.
 */
import { initializeApp } from 'firebase-admin/app'
import { getDatabase } from 'firebase-admin/database'
import { describe } from 'vitest'
import { describeRetentionNotices } from '@/tests/application/users/retentionNotices.contract'
import { rtdbRetentionNotices } from '@/server/adapters/rtdb/retentionNotices'

const host = process.env.FIREBASE_DATABASE_EMULATOR_HOST

describe.skipIf(!host)('Realtime Database emulator', () => {
  const db = getDatabase(
    initializeApp(
      {
        projectId: 'demo-et-dagen',
        databaseURL: `http://${host}?ns=demo-et-dagen-default-rtdb`,
      },
      'retention-notices-contract',
    ),
  )

  describeRetentionNotices('rtdb', async () => {
    await db.ref('retention').remove()
    return rtdbRetentionNotices(db)
  })
})
