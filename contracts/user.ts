import { z } from 'zod'

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
 * v1 has no coordinator, so a coordinator's profile is stored as a student's.
 */
export function toV1User(uid: string, user: UserInput) {
  const student = user.userType === 'company' ? null : user
  return {
    profile: {
      uid,
      userType: user.userType === 'coordinator' ? 'basic' : user.userType,
      studyProgram: student?.studyProgram || null,
      currentYear: student?.currentYear ? String(student.currentYear) : null,
      companyUID: user.userType === 'company' ? user.companyUID : null,
      dietaryRestrictions: [...new Set(user.dietaryRestrictions)],
    },
    // no email: v1 leaves the sign-in address as it is when none is sent
    account: { uid, name: user.name },
    access: { uid, ...accessOf(user) },
  }
}

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
