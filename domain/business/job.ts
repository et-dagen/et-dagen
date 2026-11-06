import { opaqueUid, type Brand } from '@/domain/brand'
import type { CompanyUid } from '@/domain/business/company'

export const JOB_TYPES = ['full-time', 'graduate', 'summer-internship'] as const
export type JobType = (typeof JOB_TYPES)[number]

/**
 * How the site shows a job: its description as rich text, or a short summary and a link to the
 * company's own listing
 */
export const JOB_LISTINGS = ['text', 'link'] as const
export type JobListing = (typeof JOB_LISTINGS)[number]

/**
 * When applications close: on a date, as soon as possible ("Snarest"), or when the job is filled
 * ("Løpende")
 */
export const DEADLINE_TYPES = ['date', 'asap', 'rolling'] as const
export type DeadlineType = (typeof DEADLINE_TYPES)[number]

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

/**
 * A job listing
 *
 * @remarks
 * Shaped after what v1 stores, which is looser than the form: a job on a date may have lost its
 * date, and older jobs carry types from before the current three.
 */
export interface Job {
  uid: JobUid
  companyUid: CompanyUid
  title: string
  /** Rich text for a listing on the site; a plain summary, possibly empty, for a link */
  description: string
  /** null when the stored type is none of {@link JOB_TYPES} */
  type: JobType | null
  location: string
  listing: JobListing
  /** The company's own listing, or '' when there is none */
  applicationLink: string
  deadlineType: DeadlineType
  /** `YYYY-MM-DD`, or a wall-clock date-time in Oslo for older jobs; null unless on a date */
  deadline: string | null
}
