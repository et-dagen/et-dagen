import { describeJobRepository } from '@/tests/application/jobs/jobRepository.contract'
import { memoryJobRepository } from '@/server/adapters/memory/jobRepository'

describeJobRepository('memory', (seed) => memoryJobRepository(seed))
