import { z } from 'zod'

const year = z.coerce
  .number({ error: 'required' })
  .int('required')
  .min(1, 'required')
  .max(5, 'required')

/**
 * What a signed-in user edits about themselves on `/user/edit`
 *
 * @remarks
 * Messages are keys under `form.errors`. The email address is the sign-in and the study
 * programme is chosen when signing up; an admin changes them in the admin panel. A student has a
 * year; a company contact has none.
 */
export const profileInput = (student: boolean) =>
  z.object({
    name: z
      .string({ error: 'required' })
      .trim()
      .min(1, 'required')
      .max(100, 'too_long'),
    currentYear: student ? year : z.null().default(null),
    dietaryRestrictions: z.array(z.string().trim().min(1)).default([]),
  })

export type ProfileInput = z.infer<ReturnType<typeof profileInput>>

/**
 * The bodies the form sends: the profile for `POST /user` and the name for `PUT /user`
 *
 * @remarks
 * `POST /user` replaces the study programme, so the stored one is sent back unchanged.
 * `PUT /user` needs the uid even for your own account.
 */
export function toV1Profile(
  uid: string,
  input: ProfileInput,
  studyProgram: string | null | undefined,
) {
  return {
    profile: {
      studyProgram: studyProgram || null,
      currentYear: input.currentYear ? String(input.currentYear) : null,
      dietaryRestrictions: [...new Set(input.dietaryRestrictions)],
    },
    account: { uid, name: input.name },
  }
}
