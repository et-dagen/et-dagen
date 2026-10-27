import { entitlementsFor } from '@/domain/authorization/entitlements'
import type { Subject } from '@/domain/authorization/subject'
import { Instant } from '@/domain/time'
import { UserUid } from '@/domain/user'
import { entitledFromAffiliation } from '@/server/adapters/rtdb/accessRecords'
import { storedUserOf } from '@/server/adapters/rtdb/userRecord'
import { accessOf, affiliationOf } from '@/tests/support/legacyFixtures'

/**
 * The subject the middleware builds for a user given in the v1 shape, with the stored companies
 *
 * @remarks
 * Goes through the same mappers as `server/middleware/user.ts`, so a handler test sees the
 * entitlements a real request would carry.
 */
export function subjectOf(
  user: { uid: string } & Record<string, unknown>,
  companies: Record<string, Record<string, unknown>> = {},
): Subject {
  const stored = storedUserOf(user, Instant.now(), accessOf(user))
  return {
    uid: UserUid.parse(user.uid),
    roles: stored.roles,
    applicant: stored.applicant,
    companies: new Map(
      stored.companies.flatMap((uid) => {
        const company = companies[uid]
        if (!company) return []
        const entitled = entitledFromAffiliation(
          uid,
          String(company.name ?? ''),
          affiliationOf(company),
        )
        return [[uid, entitlementsFor(entitled)]]
      }),
    ),
  }
}
