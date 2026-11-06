import type { Applicant } from '@/domain/authorization/eligibility'
import type { Entitlement } from '@/domain/authorization/entitlements'
import type { CompanyUid } from '@/domain/business/company'
import type { ISO8601String } from '@/domain/time'
import type { Role, UserUid } from '@/domain/user'

/** A stored user as the request pipeline reads it */
export interface StoredUser {
  roles: Role[]
  applicant: Applicant | null
  /** The companies the user acts for */
  companies: CompanyUid[]
  /** Entitlements an admin took from the user at a company, which the company keeps */
  withheld?: ReadonlyMap<CompanyUid, readonly Entitlement[]>
  /** The profile as stored, for the v1 handlers that still read `event.context.user` */
  record: Readonly<Record<string, unknown>>
}

/** Where user profiles are stored */
export interface UserRepository {
  /**
   * The user, or null when no profile is stored
   *
   * @remarks
   * Takes `now` because v1 stores a study year, and whether a student is still enrolled depends
   * on the date.
   */
  find(uid: UserUid, now: ISO8601String): Promise<StoredUser | null>
  /** Delete the profiles. Profiles that are already gone count as deleted. */
  remove(users: readonly UserUid[]): Promise<void>
}
