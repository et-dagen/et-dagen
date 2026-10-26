import type { Stamp } from '@/application/stamp'
import type { Affiliation } from '@/domain/authorization/affiliation'
import type { CompanyUid } from '@/domain/business/company'

/** Where each company's current affiliation is stored */
export interface AffiliationRepository {
  /** Store the company's affiliation in place of the one it had */
  set(
    company: CompanyUid,
    affiliation: Affiliation,
    stamp: Stamp,
  ): Promise<void>
  /** Forget the companies' affiliations. Ones already gone count as removed. */
  remove(companies: readonly CompanyUid[]): Promise<void>
}
