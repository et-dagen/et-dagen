import type { Database } from 'firebase-admin/database'
import type { CompanyRepository } from '@/application/companies/companyRepository'
import type { EntitledCompany } from '@/domain/authorization/entitlements'
import {
  entitledFromAffiliation,
  type AffiliationRecord,
} from '@/server/adapters/rtdb/accessRecords'

/** The fields of a `companies/<uid>` node the repository reads */
export interface CompanyRecord {
  name?: string | null
}

const entitledOf = (
  uid: string,
  record: CompanyRecord,
  affiliation: AffiliationRecord | null,
): EntitledCompany =>
  entitledFromAffiliation(uid, record.name ?? '', affiliation ?? {})

/**
 * Companies under `companies/<uid>` in the Realtime Database
 *
 * @remarks
 * A company's tier and entitlements come from `affiliations/<uid>`. A company without one reads
 * as a former company, which grants nothing.
 */
export const rtdbCompanyRepository = (
  db: Pick<Database, 'ref'>,
): CompanyRepository => ({
  entitled: async (uids) => {
    const records = await Promise.all(
      uids.map(async (uid) => {
        const [company, affiliation] = await Promise.all([
          db.ref(`companies/${uid}`).once('value'),
          db.ref(`affiliations/${uid}`).once('value'),
        ])
        return [uid, company.val(), affiliation.val()] as const
      }),
    )
    return records.flatMap(([uid, record, affiliation]) =>
      record ? [entitledOf(uid, record, affiliation)] : [],
    )
  },
  all: async () => {
    const [companies, affiliations] = await Promise.all(
      ['companies', 'affiliations'].map(
        async (node) => (await db.ref(node).once('value')).val() ?? {},
      ),
    )
    return Object.entries(companies as Record<string, CompanyRecord>).map(
      ([uid, record]) => entitledOf(uid, record, affiliations[uid] ?? null),
    )
  },
  logoOf: async (uid) => {
    const logo = (await db.ref(`companies/${uid}/logo`).once('value')).val()
    return typeof logo === 'string' && logo !== '' ? logo : null
  },
  setLogo: async (uid, link) => {
    await db.ref(`companies/${uid}/logo`).set(link)
  },
})
