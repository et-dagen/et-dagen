import type {
  AffiliationRepository,
  StoredAffiliation,
} from '@/application/companies/affiliationRepository'
import type { Affiliation } from '@/domain/authorization/affiliation'
import type { CompanyUid } from '@/domain/business/company'

/**
 * Affiliations held in a map, for tests and local work
 *
 * @remarks
 * `read` is not part of the port; tests use it to see what was stored.
 */
export function memoryAffiliationRepository(): AffiliationRepository & {
  read(company: CompanyUid): Affiliation | undefined
} {
  const stored = new Map<CompanyUid, StoredAffiliation>()
  return {
    set: (company, affiliation, { at }) => {
      stored.set(company, {
        company,
        affiliation: structuredClone(affiliation),
        setAt: at,
      })
      return Promise.resolve()
    },
    all: () => Promise.resolve(structuredClone([...stored.values()])),
    remove: (companies) => {
      for (const company of companies) stored.delete(company)
      return Promise.resolve()
    },
    read: (company) => stored.get(company)?.affiliation,
  }
}
