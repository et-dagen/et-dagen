import { z } from 'zod'
import { EmailAddress } from '@/domain/email'

/** The kinds of account the admin form sets, from the one with the most access down */
export const USER_TYPES = ['admin', 'coordinator', 'company', 'basic'] as const

export type UserType = (typeof USER_TYPES)[number]

const required = z.string({ error: 'required' }).trim().min(1, 'required')
const year = z.coerce
  .number({ error: 'required' })
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
 * may have them; a company account belongs to a company instead. A coordinator is a student
 * responsible for one or more companies. Whether the year fits the
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
  z.object({
    ...common,
    userType: z.literal('coordinator'),
    studyProgram: required,
    currentYear: year,
    companyUIDs: z.array(z.string().min(1)).min(1, 'required'),
  }),
  z.object({ ...common, userType: z.literal('company'), companyUID: required }),
])
export type UserInput = z.infer<typeof UserInput>

/**
 * The bodies the form sends: the profile for `POST /user`, the name for `PUT /user` and the roles
 * and memberships for `PUT /user/access`
 *
 * @remarks
 * The kind of account is stored only as roles and memberships, through `/user/access`.
 */
export function toV1User(uid: string, user: UserInput) {
  const student = user.userType === 'company' ? null : user
  return {
    profile: {
      uid,
      studyProgram: student?.studyProgram || null,
      currentYear: student?.currentYear ? String(student.currentYear) : null,
      dietaryRestrictions: [...new Set(user.dietaryRestrictions)],
    },
    // no email: v1 leaves the sign-in address as it is when none is sent
    account: { uid, name: user.name },
    access: { uid, ...accessOf(user) },
  }
}

const count = (value: string, pattern: RegExp) =>
  (value.match(pattern) ?? []).length

/** The site's password rule: at least 8 characters, 3 of them letters and 3 digits */
const password = z
  .string({ error: 'required' })
  .min(1, 'required')
  .min(8, 'password_length')
  .refine((value) => count(value, /[a-zA-Z]/g) >= 3, 'password_letters')
  .refine((value) => count(value, /\d/g) >= 3, 'password_digits')

const email = z
  .string({ error: 'required' })
  .trim()
  .min(1, 'required')
  .refine(EmailAddress.is, 'email')

/** A choice from a list, whose error asks to choose rather than to type */
const chosen = z.string({ error: 'choose' }).trim().min(1, 'choose')

/** What a student types to create an account */
export const StudentSignup = z.object({
  name: common.name,
  email,
  password,
  studyProgram: chosen,
  currentYear: z.coerce
    .number({ error: 'choose' })
    .int('choose')
    .min(1, 'choose')
    .max(5, 'choose'),
  dietaryRestrictions: common.dietaryRestrictions,
})
export type StudentSignup = z.infer<typeof StudentSignup>

/** What a company contact types to join their company with its registration code */
export const CompanyJoin = z.object({
  code: required,
  name: common.name,
  email,
  password,
})
export type CompanyJoin = z.infer<typeof CompanyJoin>

/** A membership as `/user/access` sends it */
export interface MembershipBody {
  companyUID: string
  kind: 'employee' | 'coordinator'
}

function accessOf(user: UserInput): {
  roles: string[]
  memberships: MembershipBody[]
} {
  switch (user.userType) {
    case 'admin':
      return { roles: ['admin'], memberships: [] }
    case 'coordinator':
      return {
        roles: ['coordinator'],
        memberships: user.companyUIDs.map((companyUID) => ({
          companyUID,
          kind: 'coordinator',
        })),
      }
    case 'company':
      return {
        roles: ['company'],
        memberships: [{ companyUID: user.companyUID, kind: 'employee' }],
      }
    default:
      return { roles: ['user'], memberships: [] }
  }
}

/**
 * The kind of account the form shows for stored roles and memberships
 *
 * @remarks
 * The form offers one kind per account, so the role with the most access decides.
 */
export function userTypeOf(access: {
  roles: string[]
  memberships: MembershipBody[]
}): { userType: UserType; companyUIDs: string[] } {
  const companyUIDs = access.memberships.map((m) => m.companyUID)
  if (access.roles.includes('admin')) return { userType: 'admin', companyUIDs }
  if (access.roles.includes('coordinator'))
    return { userType: 'coordinator', companyUIDs }
  if (access.roles.includes('company'))
    return { userType: 'company', companyUIDs }
  return { userType: 'basic', companyUIDs: [] }
}
