import { describeFileRepository } from '@/tests/application/files/fileRepository.contract'
import { describeFileStorage } from '@/tests/application/files/fileStorage.contract'
import { memoryFileRepository } from '@/server/adapters/memory/fileRepository'
import { memoryFileStorage } from '@/server/adapters/memory/fileStorage'

describeFileRepository('memory', () => memoryFileRepository())
describeFileStorage('memory', () => memoryFileStorage())
