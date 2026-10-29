import type { EmailAddress } from '@/domain/email'
import type { ISO8601String } from '@/domain/time'
import type { UserUid } from '@/domain/user'

/**
 * Opens accounts on the server, for people who prove their address another way
 *
 * @remarks
 * Students sign up in the browser; an invited contact proves the address by opening the link,
 * so the server opens the account as verified, with an empty profile for roles to hang on.
 */
export interface NewAccounts {
  /**
   * @returns the new account's uid, or null when the address already has an account
   */
  open(account: {
    email: EmailAddress
    name: string
    password: string
    now: ISO8601String
  }): Promise<UserUid | null>
}
