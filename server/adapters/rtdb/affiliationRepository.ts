import type { Database } from 'firebase-admin/database'
import type { AffiliationRepository } from '@/application/companies/affiliationRepository'
import { CompanyUid } from '@/domain/business/company'
import { Instant } from '@/domain/time'
import {
  affiliationFrom,
  type AffiliationRecord,
} from '@/server/adapters/rtdb/accessRecords'

/** Affiliations under `affiliations/<companyUid>` in the Realtime Database */
export const rtdbAffiliationRepository = (
  db: Pick<Database, 'ref'>,
): AffiliationRepository => ({
  set: async (company, { tier, overrides, formerTier }, { at, by }) => {
    const record: AffiliationRecord = {
      tier,
      overrides,
      ...(formerTier && { formerTier }),
      createdAt: at,
      createdBy: by,
    }
    await db.ref(`affiliations/${company}`).set(record)
  },
  all: async () => {
    const records: Record<string, AffiliationRecord> =
      (await db.ref('affiliations').once('value')).val() ?? {}
    return Object.entries(records).map(([uid, record]) => ({
      company: CompanyUid.parse(uid),
      affiliation: affiliationFrom(record),
      setAt: record.createdAt ? Instant.tryParse(record.createdAt) : null,
    }))
  },
  remove: async (companies) => {
    if (companies.length === 0) return
    await db
      .ref('affiliations')
      .update(Object.fromEntries(companies.map((uid) => [uid, null])))
  },
})
