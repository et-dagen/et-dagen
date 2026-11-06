import type { AffiliationRepository } from '@/application/companies/affiliationRepository'
import {
  afterTheFair,
  changesAtReset,
  nextFairFrom,
} from '@/domain/authorization/affiliation'
import { Instant, type ISO8601String } from '@/domain/time'
import { UserUid } from '@/domain/user'

/** Who the reset's changes are stamped by: the task, not a person */
export const TIER_RESET_TASK = UserUid.parse('task:companies:tier-reset')

/**
 * Make the last fair's companies former companies, which ends their résumé access
 *
 * @remarks
 * Run once a year, after the fair (`nextFairFrom`). Affiliations set for the next fair are left
 * alone, and so are former companies with nothing extra, so running it twice changes nothing.
 * One without a known time counts as the last fair's.
 *
 * @returns how many companies it reset
 */
export async function resetTiers(
  deps: { affiliations: AffiliationRepository },
  request: { now: ISO8601String },
): Promise<number> {
  const { now } = request
  const cutoff = nextFairFrom(now)
  const lastFairs = (await deps.affiliations.all()).filter(
    ({ affiliation, setAt }) =>
      changesAtReset(affiliation) &&
      (setAt === null || Instant.compare(setAt, cutoff) < 0),
  )
  for (const { company, affiliation } of lastFairs) {
    await deps.affiliations.set(company, afterTheFair(affiliation), {
      at: now,
      by: TIER_RESET_TASK,
    })
  }
  return lastFairs.length
}
