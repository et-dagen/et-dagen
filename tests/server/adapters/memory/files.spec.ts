import { describeFileRepository } from '../../../application/files/fileRepository.contract'
import { memoryFileRepository } from '@/server/adapters/memory/fileRepository'

describeFileRepository('memory', () => memoryFileRepository())
