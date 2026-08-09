import type { StudyProgramme } from '@/domain/ntnu'

export type Role = 'admin' | 'coordinator' | 'company' | 'user'

export interface BaseUser {
  uid: string
  email: string
  roles: Role[]
  updated: number
  dietaryRestrictions?: string[]
}

/**
 * Some users should have names
 */
export interface UserWithName {
  name: string
}

/**
 * University student users
 *
 * @remarks
 * For keeping track of programme attendence and progression for limited events.
 * Student users have to enlist for events.
 */
export interface StudentUser extends BaseUser, UserWithName {
  programme: StudyProgramme
  year: number
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
export interface CoordinatorUser extends StudentUser, UserWithName {
  companyUID: string[] // company coordinators can have multiple companies
}

/**
 * Non-student user working at an attending company
 *
 * @remarks
 * May change details of it's own company, events and job listings.
 * Cannot sign up for events, but are counted in counter for hosting.
 */
export interface CompanyUser extends BaseUser {
  companyUID: string
}
