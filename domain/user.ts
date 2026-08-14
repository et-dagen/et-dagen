import type { EmailAddress } from '@/domain/email'
import type { StudyProgramme, StudyYear } from '@/domain/ntnu'
import { opaqueUid, type Brand } from '@/domain/brand'
import type { CompanyUid } from '@/domain/business/company'
import type { ISO8601String } from '@/domain/time'
import type { HasName } from '@/domain/traits'
import type { DietaryRestriction } from '@/domain/allergen'

export type Role = 'admin' | 'coordinator' | 'company' | 'user'

/**
 * Identifies a user
 *
 * @remarks
 * Minted by Firebase Auth, which makes it the one identifier in this domain that an external
 * system owns. It is therefore treated as *opaque*: {@link parse} rejects only the empty string,
 * and nothing anywhere may test its length, charset or shape. Firebase happens to issue 28
 * alphanumeric characters; encoding that fact in a check would turn a change of auth provider —
 * NTNU SSO, say — into a change that reaches every rule in `domain/authorization`, instead of the
 * single mapper that reads the token.
 *
 * The same reasoning is why the type is not called `FirebaseUid`. The domain knows a user has an
 * identity; it does not know who issued it.
 *
 * Contrast {@link CompanyUid}, which this application mints itself. Both are branded so neither can
 * be passed where the other is expected — the two are not interchangeable even though both are
 * strings at runtime.
 */
export type UserUid = Brand<string, 'UserUid'>

export const UserUid = opaqueUid<UserUid>('User uid')

export interface BaseUser {
  uid: UserUid
  email: EmailAddress
  roles: Role[]
  /** When the record last changed */
  updated: ISO8601String
  dietaryRestrictions?: DietaryRestriction[]
}

/**
 * University student users
 *
 * @remarks
 * For keeping track of programme attendence and progression for limited events.
 * Student users have to enlist for events.
 */
export interface StudentUser extends BaseUser, HasName {
  programme: StudyProgramme
  year: StudyYear
}

/**
 * Company coordinators from E&T-dagene
 *
 * @remarks
 * Coordinators have the ability to modify events, jobs listings and details on their respective companies,
 * while keeping the ability to registering and act as normal users on the side.
 * Automatically signed up to events hosted by companies under their responsibility,
 * not counted as attendants but hosts.
 */
export interface CoordinatorUser extends StudentUser {
  companyUid: CompanyUid[] // company coordinators can have multiple companies
}

/**
 * Non-student user working at an attending company
 *
 * @remarks
 * May change details of it's own company, events and job listings.
 * Cannot sign up for events, but are counted in counter for hosting.
 */
export interface CompanyUser extends BaseUser {
  companyUid: CompanyUid
}
