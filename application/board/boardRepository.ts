import type { BoardMember, BoardMemberId } from '@/domain/board/member'

/** The board members the contact page lists */
export interface BoardRepository {
  /** Every member, in their order on the page */
  all(): Promise<BoardMember[]>
  /** null when no member has this id */
  find(id: BoardMemberId): Promise<BoardMember | null>
  /** Store members, adding or replacing each by id, all at once */
  save(members: readonly BoardMember[]): Promise<void>
  /** Removing a member who does not exist is not an error */
  remove(id: BoardMemberId): Promise<void>
}
