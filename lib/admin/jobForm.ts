import type { JobInput } from '@/contracts/job'

/** What the job form starts with for a new job */
export const NEW_JOB: Partial<JobInput> = {
  listing: 'text',
  deadlineType: 'date',
  applicationLink: '',
  description: '',
}

/** The job form's values for a job as v1 stores it */
export const jobFormOf = (job: Partial<JobInput>): Partial<JobInput> => ({
  listing: job.listing ?? 'text',
  title: job.title,
  companyUID: job.companyUID,
  jobType: job.jobType,
  location: job.location,
  deadlineType: job.deadlineType ?? (job.deadline ? 'date' : 'rolling'),
  // v1 has stored deadlines with and without a time; the form edits the date
  deadline: job.deadline?.slice(0, 10) ?? '',
  applicationLink: job.applicationLink ?? '',
  description: job.description ?? '',
})
