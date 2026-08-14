import type { EmailAddress } from '@/domain/email'
import type { StudyProgramme, StudyYear } from '@/domain/ntnu'
import type { Brand, ISO8601String } from '@/domain/time'
import type { HasName } from '@/domain/traits'
import type { DietaryRestriction } from '@/domain/allergen'

export type Role = 'admin' | 'coordinator' | 'company' | 'user'

export type UserUid = Brand<string, 'UserUid'>

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
  companyUid: string[] // company coordinators can have multiple companies
}

/**
 * Non-student user working at an attending company
 *
 * @remarks
 * May change details of it's own company, events and job listings.
 * Cannot sign up for events, but are counted in counter for hosting.
 */
export interface CompanyUser extends BaseUser {
  companyUid: string
}
