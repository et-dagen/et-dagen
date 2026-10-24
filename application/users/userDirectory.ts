import type { UserUid } from '@/domain/user'

/**
 * Who has an account
 *
 * @remarks
 * Separate from the {@link UserRepository}: accounts live with the identity provider, profiles
 * in the database.
 */
export interface UserDirectory {
  /** Delete the accounts. Accounts that are already gone count as deleted. */
  remove(users: readonly UserUid[]): Promise<void>
}
