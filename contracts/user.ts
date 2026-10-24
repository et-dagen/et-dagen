import { z } from 'zod'

/** The roles, from the one with the most access down */
export const USER_TYPES = ['admin', 'company', 'basic'] as const

const required = z
  .string({ required_error: 'required' })
  .trim()
  .min(1, 'required')
const year = z.coerce
  .number({ invalid_type_error: 'required' })
  .int('required')
  .min(1, 'required')
  .max(5, 'required')

const common = {
  name: required.max(100, 'too_long'),
  dietaryRestrictions: z.array(z.string().trim().min(1)).default([]),
}

/**
 * A user as the admin form sends it
 *
 * @remarks
 * Messages are keys under `form.errors`. The email address is the person's sign-in and is not
 * edited here. A student needs a study programme and year; an admin
 * may have them; a company account belongs to a company instead. Whether the year fits the
 * programme depends on the programme list, so the form only offers years that fit.
 */
export const UserInput = z.discriminatedUnion('userType', [
  z.object({
    ...common,
    userType: z.literal('basic'),
    studyProgram: required,
    currentYear: year,
  }),
  z.object({
    ...common,
    userType: z.literal('admin'),
    studyProgram: z.string().trim().default(''),
    currentYear: z
      .union([year, z.literal('').transform(() => null), z.null()])
      .default(null),
  }),
  z.object({ ...common, userType: z.literal('company'), companyUID: required }),
])
export type UserInput = z.infer<typeof UserInput>

/** The two bodies v1 needs: the profile for `POST /user` and the name for `PUT /user` */
export function toV1User(uid: string, user: UserInput) {
  const student = user.userType === 'company' ? null : user
  return {
    profile: {
      uid,
      userType: user.userType,
      studyProgram: student?.studyProgram || null,
      currentYear: student?.currentYear ? String(student.currentYear) : null,
      companyUID: user.userType === 'company' ? user.companyUID : null,
      dietaryRestrictions: [...new Set(user.dietaryRestrictions)],
    },
    // no email: v1 leaves the sign-in address as it is when none is sent
    account: { uid, name: user.name },
  }
}
