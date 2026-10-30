import type { Stamp } from '@/application/stamp'
import type { Affiliation } from '@/domain/authorization/affiliation'
import type { CompanyUid } from '@/domain/business/company'
import type { ISO8601String } from '@/domain/time'

/** An affiliation as stored, with when it was set; null when the record does not say */
export interface StoredAffiliation {
  company: CompanyUid
  affiliation: Affiliation
  setAt: ISO8601String | null
}

/** Where each company's current affiliation is stored */
export interface AffiliationRepository {
  /** Store the company's affiliation in place of the one it had */
  set(
    company: CompanyUid,
    affiliation: Affiliation,
    stamp: Stamp,
  ): Promise<void>
  /** Every stored affiliation */
  all(): Promise<StoredAffiliation[]>
  /** Forget the companies' affiliations. Ones already gone count as removed. */
  remove(companies: readonly CompanyUid[]): Promise<void>
}
