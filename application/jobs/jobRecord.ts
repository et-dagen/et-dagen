import { CompanyUid } from '@/domain/business/company'
import {
  DEADLINE_TYPES,
  JOB_TYPES,
  JobUid,
  type DeadlineType,
  type Job,
  type JobType,
} from '@/domain/business/job'

/**
 * A `jobs/<uid>` node as v1 writes it, and as v1's `GET /api/v1/job` returns it
 *
 * @remarks
 * Every field is optional because stored data has drifted from the old types (#543), and fields
 * this type does not name are kept as they are.
 */
export interface JobRecord {
  companyUID?: string
  title?: string
  description?: string
  jobType?: string | null
  location?: string
  listing?: string
  applicationLink?: string
  deadlineType?: string
  deadline?: string | null
  [field: string]: unknown
}

const isOneOf = <T extends string>(values: readonly T[], value: unknown) =>
  values.includes(value as T)

/**
 * The job a stored record describes, with the defaults v1 reads it with
 *
 * @throws RangeError when the record names no company
 */
export function jobOf(uid: string, record: JobRecord): Job {
  const deadlineType: DeadlineType = isOneOf(
    DEADLINE_TYPES,
    record.deadlineType,
  )
    ? (record.deadlineType as DeadlineType)
    : 'date'
  return {
    uid: JobUid.parse(uid),
    companyUid: CompanyUid.parse(record.companyUID ?? ''),
    title: record.title ?? '',
    description: record.description ?? '',
    type: isOneOf(JOB_TYPES, record.jobType)
      ? (record.jobType as JobType)
      : null,
    location: record.location ?? '',
    listing: record.listing === 'link' ? 'link' : 'text',
    applicationLink: record.applicationLink ?? '',
    deadlineType,
    deadline: deadlineType === 'date' ? record.deadline || null : null,
  }
}

/**
 * The record fields for some of a job's fields
 *
 * @remarks
 * A null type or deadline removes the stored one, as v1 does; fields left out are not touched.
 */
export function recordOf(job: Partial<Omit<Job, 'uid'>>): JobRecord {
  const { companyUid, type, ...same } = job
  const fields = {
    ...same,
    ...(companyUid !== undefined && { companyUID: companyUid }),
    ...(type !== undefined && { jobType: type }),
  }
  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined),
  )
}
