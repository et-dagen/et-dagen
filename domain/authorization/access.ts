import { CompanyUid } from '@/domain/business/company'
import { isRole, type Role } from '@/domain/user'

/** Every kind of company membership, so a stored one can be checked */
export const MEMBERSHIP_KINDS = ['employee', 'coordinator'] as const

export type MembershipKind = (typeof MEMBERSHIP_KINDS)[number]

export const isMembershipKind = (value: unknown): value is MembershipKind =>
  (MEMBERSHIP_KINDS as readonly unknown[]).includes(value)

/** A user acting for a company: someone who works there, or a coordinator from E&T-dagene */
export interface Membership {
  company: CompanyUid
  kind: MembershipKind
}

/** What a user holds: their roles, and the companies they act for */
export interface Access {
  roles: Role[]
  memberships: Membership[]
}

/** Why access cannot be stored as given */
export type AccessProblem =
  | 'no-roles'
  | 'membership-without-role'
  | 'duplicate-membership'

/** The role each kind of membership comes with */
const ROLE_OF: Record<MembershipKind, Role> = {
  employee: 'company',
  coordinator: 'coordinator',
}

/**
 * Why this access cannot be stored, or null when it can
 *
 * @remarks
 * A user needs at least one role, or they could do nothing at all. A membership needs the role
 * its kind comes with, so a company is never reached through a role that grants nothing for it.
 */
export function accessProblem(access: Access): AccessProblem | null {
  if (access.roles.length === 0) return 'no-roles'
  if (
    access.memberships.some(({ kind }) => !access.roles.includes(ROLE_OF[kind]))
  )
    return 'membership-without-role'
  const companies = new Set(access.memberships.map(({ company }) => company))
  if (companies.size < access.memberships.length) return 'duplicate-membership'
  return null
}

/**
 * What a new account starts with
 *
 * @remarks
 * A registration code makes the account a contact for the code's company. Everyone else signs up
 * as a student, coordinators included: an admin makes them coordinators afterwards.
 */
export const accessOnSignUp = (company: CompanyUid | null): Access =>
  company
    ? { roles: ['company'], memberships: [{ company, kind: 'employee' }] }
    : { roles: ['user'], memberships: [] }

/**
 * Read access as the admin form sends it: `{ roles: string[], memberships: { companyUID, kind }[] }`
 *
 * @remarks
 * Unknown role names and kinds are refused rather than dropped, so an admin never stores less
 * than they chose.
 */
export function checkedAccess(
  body: unknown,
): Access | { problem: 'user/invalid-access' } {
  const invalid = { problem: 'user/invalid-access' } as const
  const { roles, memberships } = (body ?? {}) as Record<string, unknown>
  if (!Array.isArray(roles) || !roles.every(isRole)) return invalid
  if (!Array.isArray(memberships)) return invalid

  const checked: Membership[] = []
  for (const membership of memberships as unknown[]) {
    const { companyUID, kind } = (membership ?? {}) as Record<string, unknown>
    if (typeof companyUID !== 'string' || companyUID === '') return invalid
    if (!isMembershipKind(kind)) return invalid
    checked.push({ company: CompanyUid.parse(companyUID), kind })
  }
  return { roles: [...new Set(roles)], memberships: checked }
}

/**
 * The access to store, without a `user` role next to `coordinator`
 *
 * @remarks
 * A coordinator already has every student grant. Permissions are the union of a user's roles, so
 * a `user` role beside it would let a coordinator sign up for the events they take attendance at.
 */
export const withoutRedundantRoles = (access: Access): Access =>
  access.roles.includes('coordinator')
    ? { ...access, roles: access.roles.filter((role) => role !== 'user') }
    : access
