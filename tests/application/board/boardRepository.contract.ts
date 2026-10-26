/**
 * What every {@link BoardRepository} adapter must do
 *
 * An adapter's test file calls {@link describeBoardRepository} with a factory, so the suite runs
 * once per adapter.
 */
import { describe, expect, it } from 'vitest'
import type { BoardRepository } from '@/application/board/boardRepository'
import {
  BoardMemberId,
  PhoneNumber,
  type BoardMember,
} from '@/domain/board/member'
import { EmailAddress } from '@/domain/email'
import { FileId } from '@/domain/files/file'

const member = (order: number, overrides: Partial<BoardMember> = {}) =>
  ({
    id: BoardMemberId.random(),
    name: `Member ${order}`,
    title: { nb: 'Leder', en: 'Manager' },
    email: EmailAddress.parse(`m${order}@et-dagen.no`),
    phone: PhoneNumber.tryParse('+47 412 89 452'),
    photo: null,
    featured: false,
    order,
    ...overrides,
  }) satisfies BoardMember

export function describeBoardRepository(
  adapter: string,
  make: () => Promise<BoardRepository> | BoardRepository,
) {
  describe(`${adapter} BoardRepository`, () => {
    it('saves, finds and lists members in their order', async () => {
      const board = await make()
      const second = member(1, { photo: FileId.random(), featured: true })
      const first = member(0, { phone: null })
      await board.save([second, first])

      expect(await board.all()).toEqual([first, second])
      expect(await board.find(second.id)).toEqual(second)
      expect(await board.find(BoardMemberId.random())).toBeNull()
    })

    it('replaces a saved member and removes one', async () => {
      const board = await make()
      const kari = member(0)
      await board.save([kari])
      await board.save([{ ...kari, name: 'Kari' }])
      expect((await board.find(kari.id))?.name).toBe('Kari')

      await board.remove(kari.id)
      await board.remove(kari.id)
      expect(await board.all()).toEqual([])
    })
  })
}
