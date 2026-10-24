import { z } from 'zod'

/** The partner levels, from the most visible down to former companies */
export const COMPANY_TYPES = [
  'main-partner',
  'partner',
  'sponsor',
  'old',
] as const

const required = z
  .string({ required_error: 'required' })
  .trim()
  .min(1, 'required')

/**
 * A company as the admin form sends it, without the logo, which is uploaded on its own
 *
 * @remarks
 * Messages are keys under `form.errors`. Only `http(s)` addresses pass, so a stored link can
 * never run script.
 */
export const CompanyInput = z.object({
  name: required.max(100, 'too_long'),
  type: z.enum(COMPANY_TYPES, { errorMap: () => ({ message: 'required' }) }),
  webpage: required.refine((url) => /^https?:\/\/\S+$/.test(url), 'url'),
  description: z.string().trim().max(2000, 'too_long').default(''),
  cvAccess: z.boolean().default(false),
})

export type CompanyInput = z.infer<typeof CompanyInput>
