/**
 * Runs the InvitationRepository contract against the Realtime Database emulator
 *
 * Needs `FIREBASE_DATABASE_EMULATOR_HOST`, which `bun run test:api` sets; skipped without it.
 */
import { initializeApp } from 'firebase-admin/app'
import { getDatabase } from 'firebase-admin/database'
import { describe } from 'vitest'
import { describeInvitationRepository } from '@/tests/application/invitations/repository.contract'
import { rtdbInvitationRepository } from '@/server/adapters/rtdb/invitationRepository'

const host = process.env.FIREBASE_DATABASE_EMULATOR_HOST

describe.skipIf(!host)('Realtime Database emulator', () => {
  const db = getDatabase(
    initializeApp(
      {
        projectId: 'demo-et-dagen',
        databaseURL: `http://${host}?ns=demo-et-dagen-default-rtdb`,
      },
      'invitation-repository-contract',
    ),
  )

  describeInvitationRepository('rtdb', async () => {
    await db.ref('invitations').remove()
    return rtdbInvitationRepository(db)
  })
})
