/**
 * Runs the FileRepository contract against the Realtime Database emulator
 *
 * Needs `FIREBASE_DATABASE_EMULATOR_HOST`, which `bun run test:api` sets; skipped without it.
 */
import { initializeApp } from 'firebase-admin/app'
import { getDatabase } from 'firebase-admin/database'
import { describe } from 'vitest'
import { describeFileRepository } from '../../../application/files/fileRepository.contract'
import { rtdbFileRepository } from '@/server/adapters/rtdb/fileRepository'

const host = process.env.FIREBASE_DATABASE_EMULATOR_HOST

describe.skipIf(!host)('Realtime Database emulator', () => {
  const db = getDatabase(
    initializeApp(
      {
        projectId: 'demo-et-dagen',
        databaseURL: `http://${host}?ns=demo-et-dagen-default-rtdb`,
      },
      'file-repository-contract',
    ),
  )

  describeFileRepository('rtdb', async () => {
    await db.ref('files').remove()
    return rtdbFileRepository(db)
  })
})
