import type { ProgrammeRepository } from '@/application/fair/programmeRepository'
import type { Programme } from '@/domain/fair/programme'

/**
 * Programmes in a map, and each student's programme by uid, for tests
 *
 * @remarks
 * `programmeOf` is not part of the port; tests use it to see where a rename moved a student.
 */
export function memoryProgrammeRepository(
  seed: readonly Programme[] = [],
  students: Readonly<Record<string, string>> = {},
): ProgrammeRepository & { programmeOf(uid: string): string | undefined } {
  const programmes = new Map(seed.map((programme) => [programme.id, programme]))
  const chosen = new Map(Object.entries(students))
  const on = (name: string) =>
    [...chosen]
      .filter(([, programme]) => programme === name)
      .map(([uid]) => uid)

  return {
    all: () => Promise.resolve([...programmes.values()]),
    find: (id) => Promise.resolve(programmes.get(id) ?? null),
    save: (programme) => {
      programmes.set(programme.id, programme)
      return Promise.resolve()
    },
    rename: (programme, from) => {
      const moving = on(from)
      programmes.set(programme.id, programme)
      for (const uid of moving) chosen.set(uid, programme.name)
      return Promise.resolve(moving.length)
    },
    students: (name) => Promise.resolve(on(name).length),
    remove: (id) => {
      programmes.delete(id)
      return Promise.resolve()
    },
    programmeOf: (uid) => chosen.get(uid),
  }
}
