/**
 * Runs the AffiliationRepository contract against the Realtime Database emulator
 *
 * Needs `FIREBASE_DATABASE_EMULATOR_HOST`, which `bun run test:api` sets; skipped without it.
 */
import { initializeApp } from 'firebase-admin/app'
import { getDatabase } from 'firebase-admin/database'
import { describe } from 'vitest'
import { describeAffiliationRepository } from '@/tests/application/companies/affiliations.contract'
import { entitledFromAffiliation } from '@/server/adapters/rtdb/accessRecords'
import { rtdbAffiliationRepository } from '@/server/adapters/rtdb/affiliationRepository'

const host = process.env.FIREBASE_DATABASE_EMULATOR_HOST

describe.skipIf(!host)('Realtime Database emulator', () => {
  const db = getDatabase(
    initializeApp(
      {
        projectId: 'demo-et-dagen',
        databaseURL: `http://${host}?ns=demo-et-dagen-default-rtdb`,
      },
      'affiliation-repository-contract',
    ),
  )

  describeAffiliationRepository('rtdb', async () => {
    await db.ref('affiliations').remove()
    return {
      store: rtdbAffiliationRepository(db),
      // read back the way the company repository does
      held: async (company) => {
        const record = (
          await db.ref(`affiliations/${company}`).once('value')
        ).val()
        if (!record) return null
        const read = entitledFromAffiliation(company, '', record)
        return { tier: read.relationship, overrides: read.entitlementOverrides }
      },
    }
  })
})
