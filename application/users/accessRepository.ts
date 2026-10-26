import type { Access } from '@/domain/authorization/access'
import type { ISO8601String } from '@/domain/time'
import type { UserUid } from '@/domain/user'

/** When a change was made, and by whom */
export interface Stamp {
  at: ISO8601String
  by: UserUid
}

/** Where users' roles and company memberships are stored */
export interface AccessRepository {
  /**
   * Store the user's roles and memberships in place of what they had
   *
   * @remarks
   * A role or membership that stays keeps the stamp it was given with. A membership taken away
   * is ended rather than deleted, so who acted for a company stays on record until the user is
   * erased.
   */
  replace(user: UserUid, access: Access, stamp: Stamp): Promise<void>
}
