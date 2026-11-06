import { describeResumeIndex } from '@/tests/application/users/resumeIndex.contract'
import { memoryResumeIndex } from '@/server/adapters/memory/resumeIndex'

describeResumeIndex('memory', (seed) => memoryResumeIndex(seed))
