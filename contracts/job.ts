import { z } from 'zod'
import {
  DEADLINE_TYPES,
  JOB_LISTINGS,
  JOB_TYPES,
  type DeadlineType,
  type JobListing,
} from '@/domain/business/job'

export { JOB_TYPES, JOB_LISTINGS, DEADLINE_TYPES }
export type { JobListing, DeadlineType }

const required = z.string({ error: 'required' }).trim().min(1, 'required')

/** Rich text counts as empty when it holds no visible characters */
export const hasText = (html: string) =>
  html.replace(/<[^>]*>/g, '').trim().length > 0

const link = z
  .string()
  .trim()
  .refine((value) => value === '' || /^https?:\/\/\S+$/.test(value), 'url')

const common = {
  title: required.max(120, 'too_long'),
  companyUID: required,
  jobType: z.enum(JOB_TYPES, { error: 'required' }),
  location: required.max(120, 'too_long'),
  deadlineType: z.enum(DEADLINE_TYPES).default('date'),
  /** A date, `YYYY-MM-DD`, as v1 stores it; only for a deadline on a date */
  deadline: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value),
      'date',
    )
    .default(''),
}

// one variant per listing, so every field's error shows at once whichever is chosen
/**
 * A job listing as the admin form sends it
 *
 * @remarks
 * Messages are keys under `form.errors` in the locale files, so the same schema can check
 * requests on the server later (#525) and still give translated messages in the form.
 */
export const JobInput = z.discriminatedUnion('listing', [
  z.object({
    ...common,
    listing: z.literal('text'),
    applicationLink: link,
    /** Rich text, shown on the site */
    description: z.string({ error: 'required' }).refine(hasText, 'required'),
  }),
  z.object({
    ...common,
    listing: z.literal('link'),
    applicationLink: link.refine((value) => value !== '', 'required'),
    /** An optional plain-text summary above the link */
    description: z.string().trim().max(300, 'too_long').default(''),
  }),
])

export type JobInput = z.infer<typeof JobInput>

/** The form's schema: a deadline on a date needs the date */
export const checkedJobInput = JobInput.superRefine((job, ctx) => {
  if (job.deadlineType === 'date' && job.deadline === '') {
    ctx.addIssue({ code: 'custom', path: ['deadline'], message: 'required' })
  }
})

/** The body v1 stores: no date unless the deadline is on one */
export const toV1Job = (job: JobInput) => ({
  ...job,
  deadline: job.deadlineType === 'date' ? job.deadline : null,
})
