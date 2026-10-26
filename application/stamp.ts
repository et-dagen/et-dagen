import type { ISO8601String } from '@/domain/time'
import type { UserUid } from '@/domain/user'

/** When a change was made, and by whom */
export interface Stamp {
  at: ISO8601String
  by: UserUid
}
