/**
 * Runs the StandMapIndex contract against the Realtime Database emulator
 *
 * Needs `FIREBASE_DATABASE_EMULATOR_HOST`, which `bun run test:api` sets; skipped without it.
 */
import { initializeApp } from 'firebase-admin/app'
import { getDatabase } from 'firebase-admin/database'
import { describe } from 'vitest'
import { describeStandMapIndex } from '@/tests/application/fair/standMapIndex.contract'
import { rtdbStandMapIndex } from '@/server/adapters/rtdb/standMapIndex'

const host = process.env.FIREBASE_DATABASE_EMULATOR_HOST

describe.skipIf(!host)('Realtime Database emulator', () => {
  const db = getDatabase(
    initializeApp(
      {
        projectId: 'demo-et-dagen',
        databaseURL: `http://${host}?ns=demo-et-dagen-default-rtdb`,
      },
      'stand-map-index-contract',
    ),
  )

  describeStandMapIndex('rtdb', async () => {
    await db.ref('fair/standmaps').remove()
    return rtdbStandMapIndex(db)
  })
})
