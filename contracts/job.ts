import { z } from 'zod'

/**
 * A job listing as the admin form sends it
 *
 * @remarks
 * Messages are keys under `form.errors` in the locale files, so the same schema can check
 * requests on the server later (#525) and still give translated messages in the form.
 */
export const JOB_TYPES = ['full-time', 'graduate', 'summer-internship'] as const

const required = z
  .string({ required_error: 'required' })
  .trim()
  .min(1, 'required')

/** Rich text counts as empty when it holds no visible characters */
const hasText = (html: string) => html.replace(/<[^>]*>/g, '').trim().length > 0

export const JobInput = z.object({
  title: required.max(120, 'too_long'),
  companyUID: required,
  jobType: z.enum(JOB_TYPES, { errorMap: () => ({ message: 'required' }) }),
  location: required.max(120, 'too_long'),
  /** A date, `YYYY-MM-DD`, as v1 stores it */
  deadline: z
    .string({ required_error: 'required' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date'),
  applicationLink: z
    .string()
    .trim()
    .refine((link) => link === '' || /^https?:\/\/\S+$/.test(link), 'url'),
  description: z
    .string({ required_error: 'required' })
    .refine(hasText, 'required'),
})

export type JobInput = z.infer<typeof JobInput>
