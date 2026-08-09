import type { StudyProgramme } from '@/domain/ntnu'

export type Role = 'admin' | 'coordinator' | 'company' | 'user'

export interface BaseUser {
  uid: string
  email: string
  name: string
  roles: Role[]
  updated: number
  dietaryRestrictions?: string[]
}

export interface StudentUser extends BaseUser {
  year: number
  programme: StudyProgramme
}

export interface CoordinatorUser extends StudentUser {
  companyUID: string[]
}

export interface CompanyUser extends BaseUser {
  companyUID: string
}
