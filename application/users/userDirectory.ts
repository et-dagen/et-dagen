import type { UserUid } from '@/domain/user'

/**
 * Who has an account
 *
 * @remarks
 * Separate from a user repository: answering "does this account exist" needs only the identity
 * provider, not the stored profile.
 */
export interface UserDirectory {
  exists(uid: UserUid): Promise<boolean>
}
