import type { CompanyRepository } from '@/application/companies/companyRepository'
import type { AccessRepository } from '@/application/users/accessRepository'
import type { UserDirectory } from '@/application/users/userDirectory'
import {
  accessOnSignUp,
  accessProblem,
  type Access,
} from '@/domain/authorization/access'
import { authorize } from '@/domain/authorization/authorize'
import type { Subject } from '@/domain/authorization/subject'
import type { CompanyUid } from '@/domain/business/company'
import { fail } from '@/domain/errors'
import type { ISO8601String } from '@/domain/time'
import type { UserUid } from '@/domain/user'

/**
 * Give a user these roles and memberships in place of what they had
 *
 * @throws AppError `auth/signed-out`, `auth/forbidden`, `user/no-roles`,
 * `user/membership-without-role`, `user/duplicate-membership`, `user/not-found` or
 * `company/not-found`
 */
export async function assignAccess(
  deps: {
    access: AccessRepository
    users: UserDirectory
    companies: CompanyRepository
  },
  request: {
    subject: Subject | undefined
    user: UserUid
    access: Access
    now: ISO8601String
  },
): Promise<void> {
  const { subject, user, access, now } = request
  authorize(subject, 'user', 'assign', { scope: 'all' }, { now })

  const problem = accessProblem(access)
  if (problem) throw fail(`user/${problem}`)
  if (!(await deps.users.exists(user))) throw fail('user/not-found')

  const companies = access.memberships.map(({ company }) => company)
  const found = await deps.companies.entitled(companies)
  if (found.length < companies.length) throw fail('company/not-found')

  await deps.access.replace(user, access, { at: now, by: subject.uid })
}

/**
 * Give a new account what it starts with: a student, or a contact for the registration code's
 * company
 *
 * @remarks
 * The caller has already checked the code; this only stores the outcome.
 */
export const startAccess = (
  deps: { access: AccessRepository },
  request: { user: UserUid; company: CompanyUid | null; now: ISO8601String },
): Promise<void> =>
  deps.access.replace(request.user, accessOnSignUp(request.company), {
    at: request.now,
    by: request.user,
  })
