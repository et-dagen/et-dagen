import type { FairInfoRepository } from '@/application/fair/fairInfoRepository'
import { authorize } from '@/domain/authorization/authorize'
import type { Subject } from '@/domain/authorization/subject'
import type { FairDates } from '@/domain/fair/dates'
import type { ISO8601String } from '@/domain/time'

/**
 * Set when the fair starts and ends, which the landing page counts down to
 *
 * @throws AppError `auth/signed-out` or `auth/forbidden`
 */
export async function setFairDates(
  { fair }: { fair: FairInfoRepository },
  {
    subject,
    now,
    dates,
  }: { subject: Subject | undefined; now: ISO8601String; dates: FairDates },
): Promise<FairDates> {
  authorize(subject, 'fair', 'manage', undefined, { now })
  await fair.setDates(dates)
  return dates
}
