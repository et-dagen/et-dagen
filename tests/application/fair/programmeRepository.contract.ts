/**
 * What every {@link ProgrammeRepository} adapter must do
 *
 * An adapter's test file calls {@link describeProgrammeRepository} with a factory that seeds the
 * given programmes and students, and a probe that reads a student's programme back, since the
 * port itself cannot.
 */
import { describe, expect, it } from 'vitest'
import type { ProgrammeRepository } from '@/application/fair/programmeRepository'
import { ProgrammeId, type Programme } from '@/domain/fair/programme'

export interface SeededProgrammes {
  programmes: ProgrammeRepository
  programmeOf(uid: string): Promise<string | undefined>
}

const mtel: Programme = {
  id: ProgrammeId.parse('0'),
  name: 'MTEL',
  degree: 'integrated',
  open: true,
}
const bel: Programme = {
  id: ProgrammeId.parse('1'),
  name: 'Elektroingeniør',
  degree: 'bachelor',
  open: true,
}

export function describeProgrammeRepository(
  adapter: string,
  make: (
    seed: readonly Programme[],
    students: Record<string, string>,
  ) => Promise<SeededProgrammes> | SeededProgrammes,
) {
  describe(`${adapter} ProgrammeRepository`, () => {
    it('saves, finds, lists and removes programmes', async () => {
      const { programmes } = await make([mtel], {})
      const added = { ...bel, id: ProgrammeId.random() }

      await programmes.save(added)
      await programmes.save({ ...mtel, open: false })

      expect(await programmes.find(added.id)).toEqual(added)
      expect(await programmes.find(mtel.id)).toEqual({ ...mtel, open: false })
      expect(await programmes.all()).toHaveLength(2)

      await programmes.remove(added.id)
      await programmes.remove(added.id)
      expect(await programmes.find(added.id)).toBeNull()
    })

    it('renames a programme and moves its students, leaving the others', async () => {
      const { programmes, programmeOf } = await make([mtel, bel], {
        ada: 'MTEL',
        bo: 'MTEL',
        cy: 'Elektroingeniør',
      })

      const moved = await programmes.rename(
        { ...mtel, name: 'Elektronisk systemdesign og innovasjon' },
        'MTEL',
      )

      expect(moved).toBe(2)
      expect(await programmeOf('ada')).toBe(
        'Elektronisk systemdesign og innovasjon',
      )
      expect(await programmeOf('cy')).toBe('Elektroingeniør')
      expect((await programmes.find(mtel.id))?.name).toBe(
        'Elektronisk systemdesign og innovasjon',
      )
    })

    it('counts the students on a programme by name', async () => {
      const { programmes } = await make([mtel, bel], {
        ada: 'MTEL',
        bo: 'MTEL',
      })
      expect(await programmes.students('MTEL')).toBe(2)
      expect(await programmes.students('Elektroingeniør')).toBe(0)
    })
  })
}
