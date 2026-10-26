import type { Database } from 'firebase-admin/database'
import type { CompanyRepository } from '@/application/companies/companyRepository'
import type { EntitledCompany } from '@/domain/authorization/entitlements'
import { CompanyUid, type Relationship } from '@/domain/business/company'

/** The fields of a `companies/<uid>` node that decide what its users may do */
export interface CompanyRecord {
  name?: string | null
  type?: string | null
  cvAccess?: boolean | null
}

const RELATIONSHIPS: Record<string, Relationship> = {
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
  relationship: RELATIONSHIPS[record.type ?? ''] ?? 'prior',
  entitlementOverrides: { 'ent:resume:view': record.cvAccess === true },
})

/** Companies under `companies/<uid>` in the Realtime Database */
export const rtdbCompanyRepository = (
  db: Pick<Database, 'ref'>,
): CompanyRepository => ({
  entitled: async (uids) => {
    const records = await Promise.all(
      uids.map(async (uid) => {
        const snapshot = await db.ref(`companies/${uid}`).once('value')
        return [uid, snapshot.val() as CompanyRecord | null] as const
      }),
    )
    return records.flatMap(([uid, record]) =>
      record ? [entitledCompanyOf(uid, record)] : [],
    )
  },
})
