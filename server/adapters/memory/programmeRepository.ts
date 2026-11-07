import type { ProgrammeRepository } from '@/application/fair/programmeRepository'
import type { Programme } from '@/domain/fair/programme'

/** Programmes in a map, and what each student stored as their programme, for tests */
export function memoryProgrammeRepository(
  seed: readonly Programme[] = [],
  students: Readonly<Record<string, string>> = {},
): ProgrammeRepository {
  const programmes = new Map(
    seed.map((programme) => [programme.code, programme]),
  )
  return {
    all: () => Promise.resolve([...programmes.values()]),
    find: (code) => Promise.resolve(programmes.get(code) ?? null),
    save: (programme) => {
      programmes.set(programme.code, programme)
      return Promise.resolve()
    },
    students: ({ code, name }) =>
      Promise.resolve(
        Object.values(students).filter(
          (chosen) => chosen === code || chosen === name,
        ).length,
      ),
    remove: (code) => {
      programmes.delete(code)
      return Promise.resolve()
    },
  }
}
