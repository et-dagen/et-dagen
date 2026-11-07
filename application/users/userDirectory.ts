import type { UserUid } from '@/domain/user'

/** How to reach an account's owner */
export interface Contact {
  name: string | null
  email: string | null
}

/**
 * Who has an account
 *
 * @remarks
 * Separate from the {@link UserRepository}: accounts live with the identity provider, profiles
 * in the database, and answering "does this account exist" needs only the provider.
 */
export interface UserDirectory {
  exists(uid: UserUid): Promise<boolean>

  /** The name and email of each account that exists; missing accounts are left out */
  contacts(uids: readonly UserUid[]): Promise<Map<UserUid, Contact>>

  /** Delete the accounts. Accounts that are already gone count as deleted. */
  remove(users: readonly UserUid[]): Promise<void>
}
