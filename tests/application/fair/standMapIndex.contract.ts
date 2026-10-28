/**
 * What every {@link StandMapIndex} adapter must do
 *
 * An adapter's test file calls {@link describeStandMapIndex} with a factory, so the suite runs
 * once per adapter.
 */
import { describe, expect, it } from 'vitest'
import type { StandMapIndex } from '@/application/fair/standMapIndex'
import { FairDay } from '@/domain/fair/day'
import { FileId } from '@/domain/files/file'

const tuesday = FairDay.parse('2026-11-03')
const wednesday = FairDay.parse('2026-11-04')

export function describeStandMapIndex(
  adapter: string,
  make: () => Promise<StandMapIndex> | StandMapIndex,
) {
  describe(`${adapter} StandMapIndex`, () => {
    it('starts empty', async () => {
      expect((await (await make()).all()).size).toBe(0)
    })

    it('keeps one file per day, the last one set', async () => {
      const index = await make()
      const first = FileId.random()
      const second = FileId.random()
      const other = FileId.random()
      await index.set(tuesday, first)
      await index.set(tuesday, second)
      await index.set(wednesday, other)

      expect(await index.all()).toEqual(
        new Map([
          [tuesday, second],
          [wednesday, other],
        ]),
      )
    })

    it('removes a day, and a day without a map is no error', async () => {
      const index = await make()
      await index.set(tuesday, FileId.random())
      await index.remove(tuesday)
      await index.remove(wednesday)

      expect((await index.all()).size).toBe(0)
    })
  })
}
