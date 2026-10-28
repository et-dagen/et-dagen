import { describeBoardRepository } from '@/tests/application/board/boardRepository.contract'
import { memoryBoardRepository } from '@/server/adapters/memory/boardRepository'

describeBoardRepository('memory', () => memoryBoardRepository())
