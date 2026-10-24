/**
 * Erasure wired to Firebase, for the v1 handlers and the retention job
 *
 * @remarks
 * The rules are in the `eraseUsers` use case. This only builds its adapters from the Firebase
 * clients the callers already hold.
 */
import type { Auth } from 'firebase-admin/auth'
import type { Database } from 'firebase-admin/database'
import { eraseUsers as erase } from '@/application/users/erasure'
import { Instant } from '@/domain/time'
import { UserUid } from '@/domain/user'
import { firebaseUserDirectory } from '@/server/adapters/firebase/userDirectory'
import {
  storageUserFiles,
  type Bucket,
} from '@/server/adapters/firebase/userFiles'
import { rtdbEventRepository } from '@/server/adapters/rtdb/eventRepository'
import { rtdbUserRepository } from '@/server/adapters/rtdb/userRepository'

export const eraseUsers = (
  stores: {
    db: Pick<Database, 'ref'>
    files: Bucket
    auth: Pick<Auth, 'getUser' | 'deleteUsers'>
  },
  uids: readonly string[],
  now: Instant = Instant.now(),
): Promise<void> =>
  erase(
    {
      files: storageUserFiles(stores.files),
      events: rtdbEventRepository(stores.db),
      profiles: rtdbUserRepository(stores.db),
      accounts: firebaseUserDirectory(stores.auth),
    },
    uids.map((uid) => UserUid.parse(uid)),
    now,
  )
