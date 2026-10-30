import type { AffiliationRepository } from '@/application/companies/affiliationRepository'
import type { CompanyRepository } from '@/application/companies/companyRepository'
import type { Affiliation } from '@/domain/authorization/affiliation'
import { authorize } from '@/domain/authorization/authorize'
import type { Subject } from '@/domain/authorization/subject'
import type { CompanyUid } from '@/domain/business/company'
import { fail } from '@/domain/errors'
import type { ISO8601String } from '@/domain/time'

/**
 * Set a company's tier and its exceptions to the tier's entitlements
 *
 * @remarks
 * A former company keeps its tier from the last fair while it stays former, so saving its
 * profile does not drop it from the front page's last fair.
 *
 * @throws AppError `auth/signed-out`, `auth/forbidden` or `company/not-found`
 */
export async function setAffiliation(
  deps: { affiliations: AffiliationRepository; companies: CompanyRepository },
  request: {
    subject: Subject | undefined
    company: CompanyUid
    affiliation: Affiliation
    now: ISO8601String
  },
): Promise<void> {
  const { subject, company, affiliation, now } = request
  authorize(subject, 'company', 'entitle', { uid: company }, { now })

  const [found] = await deps.companies.entitled([company])
  if (!found) throw fail('company/not-found')

  const formerTier =
    affiliation.tier === 'prior' ? found.formerRelationship : undefined
  await deps.affiliations.set(
    company,
    formerTier ? { ...affiliation, formerTier } : affiliation,
    {
      at: now,
      by: subject.uid,
    },
  )
}
