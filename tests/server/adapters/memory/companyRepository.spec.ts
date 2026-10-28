import { describeCompanyRepository } from '@/tests/application/companies/companyRepository.contract'
import { memoryCompanyRepository } from '@/server/adapters/memory/companyRepository'

describeCompanyRepository('memory', (seed) =>
  Promise.resolve(memoryCompanyRepository(seed)),
)
