import type { Affiliation } from '@/domain/authorization/affiliation'
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
  /** `{ 'ent:resume:view': true }`: taken from this person, kept by the company */
  withheld?: Record<string, unknown> | null
}

/** `affiliations/<companyUid>`: a company's current tier and its exceptions to it */
export interface AffiliationRecord {
  tier?: string | null
  overrides?: Record<string, unknown> | null
  formerTier?: string | null
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

/** The entitlements a membership record withholds; unknown names are ignored */
export const withheldOf = (membership: MembershipRecord): Entitlement[] =>
  Object.entries(membership.withheld ?? {})
    .filter(([name, taken]) => taken === true && isEntitlement(name))
    .map(([name]) => name as Entitlement)

/** What each active membership withholds, for the companies that withhold anything */
export const withheldFrom = (
  memberships: Record<string, MembershipRecord> | null,
): Map<CompanyUid, Entitlement[]> =>
  new Map(
    Object.entries(memberships ?? {}).flatMap(([uid, membership]) => {
      const withheld = withheldOf(membership)
      return uid !== '' && !membership.endedAt && withheld.length
        ? [[CompanyUid.parse(uid), withheld] as const]
        : []
    }),
  )

/**
 * A stored affiliation as the domain reads it
 *
 * @remarks
 * An unknown tier reads as a former company, which grants nothing by default, and an override
 * naming no known entitlement is ignored, so a typo can only take access away.
 */
export const affiliationFrom = (record: AffiliationRecord): Affiliation => ({
  tier: isRelationship(record.tier) ? record.tier : 'prior',
  overrides: Object.fromEntries(
    Object.entries(record.overrides ?? {}).filter(
      (entry): entry is [Entitlement, boolean] =>
        isEntitlement(entry[0]) && typeof entry[1] === 'boolean',
    ),
  ),
  ...(isRelationship(record.formerTier) && { formerTier: record.formerTier }),
})

/** Read a stored affiliation as the company the authorization layer sees */
export const entitledFromAffiliation = (
  uid: string,
  name: string,
  affiliation: AffiliationRecord,
): EntitledCompany => {
  const { tier, overrides, formerTier } = affiliationFrom(affiliation)
  return {
    uid: CompanyUid.parse(uid),
    name,
    relationship: tier,
    ...(formerTier && { formerRelationship: formerTier }),
    entitlementOverrides: overrides,
  }
}
