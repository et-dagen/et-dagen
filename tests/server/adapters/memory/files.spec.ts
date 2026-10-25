import { describeFileRepository } from '../../../application/files/fileRepository.contract'
import { describeFileStorage } from '../../../application/files/fileStorage.contract'
import { memoryFileRepository } from '@/server/adapters/memory/fileRepository'
import { memoryFileStorage } from '@/server/adapters/memory/fileStorage'

describeFileRepository('memory', () => memoryFileRepository())
describeFileStorage('memory', () => memoryFileStorage())
