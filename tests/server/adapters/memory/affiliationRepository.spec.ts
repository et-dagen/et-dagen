import { describeAffiliationRepository } from '@/tests/application/companies/affiliations.contract'
import { memoryAffiliationRepository } from '@/server/adapters/memory/affiliationRepository'

describeAffiliationRepository('memory', () => {
  const store = memoryAffiliationRepository()
  return {
    store,
    held: (company) => Promise.resolve(store.read(company) ?? null),
  }
})
