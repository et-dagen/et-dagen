import type { Database } from 'firebase-admin/database'
import type { CompanyRepository } from '@/application/companies/companyRepository'
import type { EntitledCompany } from '@/domain/authorization/entitlements'
import { CompanyUid, type Relationship } from '@/domain/business/company'
import {
  entitledFromAffiliation,
  type AffiliationRecord,
} from '@/server/adapters/rtdb/accessRecords'

/** The fields of a `companies/<uid>` node that decide what its users may do */
export interface CompanyRecord {
  name?: string | null
  type?: string | null
  cvAccess?: boolean | null
}

const V1_TIERS: Record<string, Relationship> = {
  'main-partner': 'mainPartner',
  partner: 'partner',
  sponsor: 'sponsor',
  old: 'prior',
}

/**
 * Read a v1 company record
 *
 * @remarks
 * An unknown type reads as a former company, which grants nothing by default. Résumé access is
 * an explicit override in both directions, so it stays exactly what `cvAccess` says whatever the
 * tier would grant.
 */
export const entitledCompanyOf = (
  uid: string,
  record: CompanyRecord,
): EntitledCompany => ({
  uid: CompanyUid.parse(uid),
  name: record.name ?? '',
  relationship: V1_TIERS[record.type ?? ''] ?? 'prior',
  entitlementOverrides: { 'ent:resume:view': record.cvAccess === true },
})

const entitledOf = (
  uid: string,
  record: CompanyRecord,
  affiliation: AffiliationRecord | null,
): EntitledCompany =>
  affiliation
    ? entitledFromAffiliation(uid, record.name ?? '', affiliation)
    : entitledCompanyOf(uid, record)

/**
 * Companies under `companies/<uid>` in the Realtime Database
 *
 * @remarks
 * A company's tier and entitlements come from `affiliations/<uid>`. Until the migration in #640
 * has run, a company without one is read from its v1 `type` and `cvAccess`.
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
})
