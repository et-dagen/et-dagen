import { describeProgrammeRepository } from '@/tests/application/fair/programmeRepository.contract'
import { memoryProgrammeRepository } from '@/server/adapters/memory/programmeRepository'

describeProgrammeRepository('memory', (seed, students) =>
  memoryProgrammeRepository(seed, students),
)
