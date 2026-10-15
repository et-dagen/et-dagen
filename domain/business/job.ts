import { opaqueUid, type Brand } from '@/domain/brand'
import type { CompanyUid } from '@/domain/business/company'
import type { Location } from '@/domain/event/location'
import type { ISO8601String } from '@/domain/time'

export type JobType = 'fullTime' | 'graduate' | 'internship'

/**
 * Identifies a job listing
 *
 * @remarks
 * Branded chiefly to keep it apart from the `companyUid` alongside it: both are strings, both are
 * push keys, and an authorization rule handed the wrong one would deny or grant against the wrong
 * entity without the compiler noticing.
 */
export type JobUid = Brand<string, 'JobUid'>

export const JobUid = opaqueUid<JobUid>('Job uid')

export interface Job {
  uid: JobUid
  companyUid: CompanyUid
  deadline?: ISO8601String
  description: string
  location: Location
  title: string
  type: JobType
}
