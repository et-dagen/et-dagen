/**
 * Erases users who have been inactive for longer than the retention period (#585)
 *
 * @remarks
 * Activity is the latest of the times Firebase Auth records for an account: created, signed in
 * and token refreshed. Refreshes count because someone who stays signed in never signs in again,
 * yet still uses the site.
 */
import type { Auth, UserRecord } from 'firebase-admin/auth'
import { isPastRetention } from '../../domain/retention'
import { Instant } from '../../domain/time'
import { eraseUsers } from './erasure'

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

/** The uids of every account past the retention limit, read a page at a time */
export async function inactiveUids(
  auth: Pick<Auth, 'listUsers'>,
  now: Instant,
): Promise<string[]> {
  const uids: string[] = []
  let pageToken: string | undefined
  do {
    const page = await auth.listUsers(1000, pageToken)
    for (const user of page.users) {
      if (isPastRetention(lastActive(user), now)) uids.push(user.uid)
    }
    pageToken = page.pageToken
  } while (pageToken)
  return uids
}

/** @returns how many users were erased */
export async function eraseInactiveUsers(
  stores: Parameters<typeof eraseUsers>[0] & {
    auth: Pick<Auth, 'deleteUsers' | 'listUsers'>
  },
  now: Instant = Instant.now(),
): Promise<number> {
  const uids = await inactiveUids(stores.auth, now)
  for (let start = 0; start < uids.length; start += BATCH_SIZE) {
    await eraseUsers(stores, uids.slice(start, start + BATCH_SIZE), now)
  }
  return uids.length
}
