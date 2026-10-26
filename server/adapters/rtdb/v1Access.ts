import {
  storedUserOf,
  type UserRecord,
} from '@/server/adapters/rtdb/userRecord'
import {
  entitledCompanyOf,
  type CompanyRecord,
} from '@/server/adapters/rtdb/companyRepository'
import type {
  AffiliationRecord,
  MembershipRecord,
  RolesRecord,
} from '@/server/adapters/rtdb/accessRecords'
import type { ISO8601String } from '@/domain/time'

/** The nodes #640 adds, as one multi-path update */
export type AccessUpdate = Record<
  string,
  RolesRecord[string] | MembershipRecord | AffiliationRecord
>

/**
 * Write what the v1 fields say as roles, memberships and affiliations
 *
 * @remarks
 * Reads what the adapters read today. Companies keep their tier and résumé access. A v1 company
 * user becomes a coordinator of their company: every account of that kind today is run by
 * E&T-dagene, and the `company` role is kept for contacts from the companies themselves. Skips
 * users and companies that already have the new nodes, so it can run again, and never touches the
 * v1 fields themselves.
 */
export function v1AccessUpdate(
  stored: {
    users: Record<string, UserRecord & Record<string, unknown>>
    companies: Record<string, CompanyRecord>
    roles: Record<string, unknown>
    affiliations: Record<string, unknown>
  },
  now: ISO8601String,
): AccessUpdate {
  const stamp = { createdAt: now, createdBy: 'migration-640' }
  const update: AccessUpdate = {}

  for (const [uid, record] of Object.entries(stored.users)) {
    if (stored.roles[uid]) continue
    const user = storedUserOf(record, now)
    for (const role of user.roles) {
      update[`roles/${uid}/${role === 'company' ? 'coordinator' : role}`] =
        stamp
    }
    for (const company of user.companies) {
      update[`memberships/${uid}/${company}`] = {
        kind: 'coordinator',
        ...stamp,
      }
    }
  }

  for (const [uid, record] of Object.entries(stored.companies)) {
    if (stored.affiliations[uid]) continue
    const company = entitledCompanyOf(uid, record)
    update[`affiliations/${uid}`] = {
      tier: company.relationship,
      overrides: company.entitlementOverrides,
      ...stamp,
    }
  }

  return update
}
