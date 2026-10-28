import { describeStandMapIndex } from '@/tests/application/fair/standMapIndex.contract'
import { memoryStandMapIndex } from '@/server/adapters/memory/standMapIndex'

describeStandMapIndex('memory', () => memoryStandMapIndex())
