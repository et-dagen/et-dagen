/**
 * Warns, then erases, users who have been inactive for longer than the retention period (#585)
 *
 * @remarks
 * Activity is the latest of the times Firebase Auth records for an account: created, signed in
 * and token refreshed. Refreshes count because someone who stays signed in never signs in again,
 * yet still uses the site.
 */
import type { Auth, UserRecord } from 'firebase-admin/auth'
import { eraseUsers } from './erasure'
import type { Mailer } from '@/application/mail/mailer'
import {
  warnBeforeErasure,
  type RetainedAccount,
} from '@/application/users/retentionNotice'
import { EmailAddress } from '@/domain/email'
import { isPastRetention } from '@/domain/retention'
import { Instant } from '@/domain/time'
import { UserUid } from '@/domain/user'
import { rtdbRetentionNotices } from '@/server/adapters/rtdb/retentionNotices'

/** Keeps the parallel Storage and database calls of one erasure run small */
const BATCH_SIZE = 100

/** When Firebase Auth last saw this account */
export function lastActive({
  metadata,
}: Pick<UserRecord, 'metadata'>): Instant {
  const times = [
    metadata.creationTime,
    metadata.lastSignInTime,
    metadata.lastRefreshTime,
  ]
    .map((time) => Date.parse(time ?? ''))
    .filter((time) => !Number.isNaN(time))
  return Instant.of(new Date(Math.max(...times)))
}

/** Every account, with its address and last activity, read a page at a time */
export async function retainedAccounts(
  auth: Pick<Auth, 'listUsers'>,
): Promise<RetainedAccount[]> {
  const accounts: RetainedAccount[] = []
  let pageToken: string | undefined
  do {
    const page = await auth.listUsers(1000, pageToken)
    for (const user of page.users) {
      accounts.push({
        uid: UserUid.parse(user.uid),
        email: user.email ? EmailAddress.tryParse(user.email) : null,
        lastActive: lastActive(user),
      })
    }
    pageToken = page.pageToken
  } while (pageToken)
  return accounts
}

/**
 * Warn the users due for a notice, then erase those past the limit
 *
 * @param stores.mailer null when the site cannot send mail; erasure then runs without warnings
 * @returns counts only, so the log never holds who was warned or erased
 */
export async function runRetention(
  stores: Parameters<typeof eraseUsers>[0] & {
    auth: Pick<Auth, 'deleteUsers' | 'listUsers'>
    mailer: Mailer | null
  },
  now: Instant = Instant.now(),
): Promise<{ notified: number; notifyFailed: number; erased: number }> {
  const accounts = await retainedAccounts(stores.auth)

  const { notified, failed } = stores.mailer
    ? await warnBeforeErasure(
        { mailer: stores.mailer, notices: rtdbRetentionNotices(stores.db) },
        accounts,
        now,
      )
    : { notified: 0, failed: 0 }

  const uids = accounts
    .filter((account) => isPastRetention(account.lastActive, now))
    .map((account) => account.uid)
  for (let start = 0; start < uids.length; start += BATCH_SIZE) {
    await eraseUsers(stores, uids.slice(start, start + BATCH_SIZE), now)
  }
  return { notified, notifyFailed: failed, erased: uids.length }
}
