/**
 * What every {@link ProgrammeRepository} adapter must do
 *
 * An adapter's test file calls {@link describeProgrammeRepository} with a factory that seeds the
 * given programmes, and what each student stored as their programme.
 */
import { describe, expect, it } from 'vitest'
import type { ProgrammeRepository } from '@/application/fair/programmeRepository'
import { ProgrammeCode, type Programme } from '@/domain/fair/programme'

const mtel: Programme = {
  code: ProgrammeCode.parse('MTEL'),
  name: 'Elektronikk',
  degree: 'integrated',
  open: true,
}
// a bachelor may share a master's name
const bel: Programme = {
  code: ProgrammeCode.parse('BELEKTRONIKK'),
  name: 'Elektronikk',
  degree: 'bachelor',
  open: true,
}

export function describeProgrammeRepository(
  adapter: string,
  make: (
    seed: readonly Programme[],
    students: Record<string, string>,
  ) => Promise<ProgrammeRepository> | ProgrammeRepository,
) {
  describe(`${adapter} ProgrammeRepository`, () => {
    it('saves, finds, lists and removes programmes by code', async () => {
      const programmes = await make([mtel], {})

      await programmes.save(bel)
      await programmes.save({ ...mtel, open: false })

      expect(await programmes.find(bel.code)).toEqual(bel)
      expect(await programmes.find(mtel.code)).toEqual({ ...mtel, open: false })
      expect(await programmes.all()).toHaveLength(2)

      await programmes.remove(bel.code)
      await programmes.remove(bel.code)
      expect(await programmes.find(bel.code)).toBeNull()
    })

    it("counts students by the programme's code, and by its name from before codes", async () => {
      const programmes = await make([mtel], {
        ada: 'MTEL',
        bo: 'Elektronikk',
        cy: 'BIELEKTRO',
      })
      expect(await programmes.students(mtel)).toBe(2)
      expect(
        await programmes.students({
          ...mtel,
          code: ProgrammeCode.parse('X1'),
          name: 'Y',
        }),
      ).toBe(0)
    })
  })
}
