import { z } from 'zod'

/**
 * A job listing as the admin form sends it
 *
 * @remarks
 * Messages are keys under `form.errors` in the locale files, so the same schema can check
 * requests on the server later (#525) and still give translated messages in the form.
 */
export const JOB_TYPES = ['full-time', 'graduate', 'summer-internship'] as const

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

const required = z
  .string({ required_error: 'required' })
  .trim()
  .min(1, 'required')

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
  jobType: z.enum(JOB_TYPES, { errorMap: () => ({ message: 'required' }) }),
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
export const JobInput = z.discriminatedUnion('listing', [
  z.object({
    ...common,
    listing: z.literal('text'),
    applicationLink: link,
    /** Rich text, shown on the site */
    description: z
      .string({ required_error: 'required' })
      .refine(hasText, 'required'),
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
