import type { CompanyRepository } from '@/application/companies/companyRepository'
import type {
  StoredUser,
  UserRepository,
} from '@/application/users/userRepository'
import { entitlementsFor } from '@/domain/authorization/entitlements'
import type { Subject } from '@/domain/authorization/subject'
import type { ISO8601String } from '@/domain/time'
import type { UserUid } from '@/domain/user'

/** Who sent a request, and the stored profile v1 handlers still read */
export interface Asking {
  subject: Subject
  record: StoredUser['record']
}

/**
 * Build the subject for a signed-in user
 *
 * @remarks
 * The one place company entitlements are resolved, so every check in a request reads the same
 * view. A user without a stored profile gets no subject rather than a partial one.
 */
export async function whoIsAsking(
  deps: { users: UserRepository; companies: CompanyRepository },
  uid: UserUid,
  now: ISO8601String,
): Promise<Asking | null> {
  const user = await deps.users.find(uid, now)
  if (!user) return null

  const companies = await deps.companies.entitled(user.companies)
  return {
    subject: {
      uid,
      roles: user.roles,
      companies: new Map(
        companies.map((company) => [company.uid, entitlementsFor(company)]),
      ),
      applicant: user.applicant,
    },
    record: user.record,
  }
}
