import { entitlementsFor } from '@/domain/authorization/entitlements'
import type { Subject } from '@/domain/authorization/subject'
import { Instant } from '@/domain/time'
import { UserUid } from '@/domain/user'
import {
  entitledCompanyOf,
  type CompanyRecord,
} from '@/server/adapters/rtdb/companyRepository'
import { storedUserOf } from '@/server/adapters/rtdb/userRecord'

/**
 * The subject the middleware builds for a stored v1 user, given the stored companies
 *
 * @remarks
 * Goes through the same mappers as `server/middleware/user.ts`, so a handler test sees the
 * entitlements a real request would carry.
 */
export function subjectOf(
  user: { uid: string } & Record<string, unknown>,
  companies: Record<string, CompanyRecord> = {},
): Subject {
  const stored = storedUserOf(user, Instant.now())
  return {
    uid: UserUid.parse(user.uid),
    roles: stored.roles,
    applicant: stored.applicant,
    companies: new Map(
      stored.companies.flatMap((uid) =>
        companies[uid]
          ? [[uid, entitlementsFor(entitledCompanyOf(uid, companies[uid]))]]
          : [],
      ),
    ),
  }
}
