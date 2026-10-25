import type { UserUid } from '@/domain/user'

/**
 * Who has an account
 *
 * @remarks
 * Separate from the {@link UserRepository}: accounts live with the identity provider, profiles
 * in the database, and answering "does this account exist" needs only the provider.
 */
export interface UserDirectory {
  exists(uid: UserUid): Promise<boolean>

  /** Delete the accounts. Accounts that are already gone count as deleted. */
  remove(users: readonly UserUid[]): Promise<void>
}
