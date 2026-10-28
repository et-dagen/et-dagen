import type { BoardRepository } from '@/application/board/boardRepository'
import type { BoardMember, BoardMemberId } from '@/domain/board/member'

/** Board members held in a map, for tests */
export function memoryBoardRepository(
  seed: readonly BoardMember[] = [],
): BoardRepository {
  const members = new Map<BoardMemberId, BoardMember>(
    seed.map((member) => [member.id, member]),
  )
  return {
    all: () =>
      Promise.resolve([...members.values()].sort((a, b) => a.order - b.order)),
    find: (id) => Promise.resolve(members.get(id) ?? null),
    save: (list) => {
      for (const member of list) members.set(member.id, member)
      return Promise.resolve()
    },
    remove: (id) => {
      members.delete(id)
      return Promise.resolve()
    },
  }
}
