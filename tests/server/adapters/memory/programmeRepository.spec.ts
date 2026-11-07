import { describeProgrammeRepository } from '@/tests/application/fair/programmeRepository.contract'
import { memoryProgrammeRepository } from '@/server/adapters/memory/programmeRepository'

describeProgrammeRepository('memory', (seed, students) => {
  const programmes = memoryProgrammeRepository(seed, students)
  return {
    programmes,
    programmeOf: (uid) => Promise.resolve(programmes.programmeOf(uid)),
  }
})
