import type { Database } from 'firebase-admin/database'
import type { AffiliationRepository } from '@/application/companies/affiliationRepository'
import type { AffiliationRecord } from '@/server/adapters/rtdb/accessRecords'

/** Affiliations under `affiliations/<companyUid>` in the Realtime Database */
export const rtdbAffiliationRepository = (
  db: Pick<Database, 'ref'>,
): AffiliationRepository => ({
  set: async (company, { tier, overrides }, { at, by }) => {
    const record: AffiliationRecord = {
      tier,
      overrides,
      createdAt: at,
      createdBy: by,
    }
    await db.ref(`affiliations/${company}`).set(record)
  },
  remove: async (companies) => {
    if (companies.length === 0) return
    await db
      .ref('affiliations')
      .update(Object.fromEntries(companies.map((uid) => [uid, null])))
  },
})
