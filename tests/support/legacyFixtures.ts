/**
 * Most tests describe users and companies the way v1 stored them: `userType` and `companyUID`,
 * `type` and `cvAccess`. These turn such a fixture into the roles, memberships and affiliation the
 * adapters read (#640), so the tests keep their fixtures and still see the access they expect.
 */
import type {
  AffiliationRecord,
  MembershipRecord,
  RolesRecord,
} from '@/server/adapters/rtdb/accessRecords'

const given = { createdBy: 'test' }

const TIERS: Record<string, string> = {
  'main-partner': 'mainPartner',
  partner: 'partner',
  sponsor: 'sponsor',
  old: 'prior',
}

/** A v1 admin is an admin, a company user a contact for its company, anyone else a student */
export function accessOf(user: Record<string, unknown>): {
  roles: RolesRecord
  memberships: Record<string, MembershipRecord> | null
} {
  if (user.userType === 'admin')
    return { roles: { admin: given }, memberships: null }
  if (user.userType !== 'company')
    return { roles: { user: given }, memberships: null }
  return {
    roles: { company: given },
    memberships:
      typeof user.companyUID === 'string'
        ? { [user.companyUID]: { kind: 'employee', ...given } }
        : null,
  }
}

/** The tier a v1 `type` names, and résumé access exactly as `cvAccess` says */
export const affiliationOf = (
  company: Record<string, unknown>,
): AffiliationRecord => ({
  tier: TIERS[String(company.type)] ?? 'prior',
  overrides: { 'ent:resume:view': company.cvAccess === true },
  ...given,
})
