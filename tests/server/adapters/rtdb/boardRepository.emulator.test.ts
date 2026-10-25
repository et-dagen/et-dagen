/**
 * Runs the BoardRepository contract against the Realtime Database emulator
 *
 * Needs `FIREBASE_DATABASE_EMULATOR_HOST`, which `bun run test:api` sets; skipped without it.
 */
import { initializeApp } from 'firebase-admin/app'
import { getDatabase } from 'firebase-admin/database'
import { describe } from 'vitest'
import { describeBoardRepository } from '@/tests/application/board/boardRepository.contract'
import { rtdbBoardRepository } from '@/server/adapters/rtdb/boardRepository'

const host = process.env.FIREBASE_DATABASE_EMULATOR_HOST

describe.skipIf(!host)('Realtime Database emulator', () => {
  const db = getDatabase(
    initializeApp(
      {
        projectId: 'demo-et-dagen',
        databaseURL: `http://${host}?ns=demo-et-dagen-default-rtdb`,
      },
      'board-repository-contract',
    ),
  )

  describeBoardRepository('rtdb', async () => {
    await db.ref('board').remove()
    return rtdbBoardRepository(db)
  })
})
