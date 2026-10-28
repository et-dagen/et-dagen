import {
  isEntitlement,
  type EntitledCompany,
  type Entitlement,
} from '@/domain/authorization/entitlements'
import { CompanyUid, isRelationship } from '@/domain/business/company'
import { isRole, type Role } from '@/domain/user'

/** `roles/<userUid>`: who holds which role; what a role grants stays in code */
export type RolesRecord = Record<
  string,
  { createdAt?: string; createdBy?: string }
>

/** `memberships/<userUid>/<companyUid>`: the companies a user acts for */
export interface MembershipRecord {
  kind?: 'employee' | 'coordinator' | string
  createdAt?: string
  createdBy?: string
  endedAt?: string | null
}

/** `affiliations/<companyUid>`: a company's current tier and its exceptions to it */
export interface AffiliationRecord {
  tier?: string | null
  overrides?: Record<string, unknown> | null
  createdAt?: string
  createdBy?: string
}

/** The stored roles a user holds; unknown names are ignored */
export const rolesFrom = (record: RolesRecord): Role[] =>
  Object.keys(record).filter(isRole)

/** The companies a user still acts for */
export const companiesFrom = (
  memberships: Record<string, MembershipRecord> | null,
): CompanyUid[] =>
  Object.entries(memberships ?? {})
    .filter(([uid, membership]) => uid !== '' && !membership.endedAt)
    .map(([uid]) => CompanyUid.parse(uid))

/**
 * Read a stored affiliation
 *
 * @remarks
 * An unknown tier reads as a former company, which grants nothing by default, and an override
 * naming no known entitlement is ignored, so a typo can only take access away.
 */
export const entitledFromAffiliation = (
  uid: string,
  name: string,
  affiliation: AffiliationRecord,
): EntitledCompany => ({
  uid: CompanyUid.parse(uid),
  name,
  relationship: isRelationship(affiliation.tier) ? affiliation.tier : 'prior',
  entitlementOverrides: Object.fromEntries(
    Object.entries(affiliation.overrides ?? {}).filter(
      (entry): entry is [Entitlement, boolean] =>
        isEntitlement(entry[0]) && typeof entry[1] === 'boolean',
    ),
  ),
})
