import type { CompanyRepository } from '@/application/companies/companyRepository'
import type { EntitledCompany } from '@/domain/authorization/entitlements'

/** Companies held in memory, for tests and local work */
export function memoryCompanyRepository(
  companies: Iterable<EntitledCompany> = [],
): CompanyRepository {
  const byUid = new Map([...companies].map((company) => [company.uid, company]))
  return {
    entitled: (uids) =>
      Promise.resolve(
        uids.flatMap((uid) => {
          const company = byUid.get(uid)
          return company ? [company] : []
        }),
      ),
    all: () => Promise.resolve([...byUid.values()]),
  }
}
