/**
 * Runs the user removal contract against the Auth, Realtime Database and Storage emulators
 *
 * Needs the emulator hosts, which `bun run test:api` sets; skipped without them.
 */
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getDatabase } from 'firebase-admin/database'
import { getStorage } from 'firebase-admin/storage'
import { describe } from 'vitest'
import { describeUserRemoval } from '@/tests/application/users/userRemoval.contract'
import {
  DATABASE_NAMESPACE,
  PROJECT_ID,
  resetEmulators,
} from '@/tests/api/support/emulators'
import { firebaseUserDirectory } from '@/server/adapters/firebase/userDirectory'
import { storageUserFiles } from '@/server/adapters/firebase/userFiles'
import { rtdbUserRepository } from '@/server/adapters/rtdb/userRepository'

const host = process.env.FIREBASE_DATABASE_EMULATOR_HOST

describe.skipIf(!host)('Firebase emulators', () => {
  const app = initializeApp(
    {
      projectId: PROJECT_ID,
      databaseURL: `http://${host}?ns=${DATABASE_NAMESPACE}`,
      storageBucket: `${PROJECT_ID}.appspot.com`,
    },
    'user-stores-contract',
  )
  const auth = getAuth(app)
  const db = getDatabase(app)
  const bucket = getStorage(app).bucket()

  describeUserRemoval('Firebase Auth', async (seed) => {
    await resetEmulators()
    await auth.importUsers(seed.map((uid) => ({ uid })))
    return {
      store: firebaseUserDirectory(auth),
      holds: (uid) =>
        auth.getUser(uid).then(
          () => true,
          () => false,
        ),
    }
  })

  describeUserRemoval('Realtime Database', async (seed) => {
    await resetEmulators()
    await db
      .ref('users')
      .set(Object.fromEntries(seed.map((uid) => [uid, { name: uid }])))
    return {
      store: rtdbUserRepository(db),
      holds: async (uid) =>
        (await db.ref(`users/${uid}`).once('value')).exists(),
    }
  })

  describeUserRemoval('Cloud Storage', async (seed) => {
    await resetEmulators()
    await Promise.all(
      seed.flatMap((uid) => [
        bucket.file(`users/${uid}/cv.pdf`).save('%PDF'),
        bucket.file(`users/${uid}/old/cv.pdf`).save('%PDF'),
      ]),
    )
    return {
      store: storageUserFiles(bucket),
      holds: async (uid) =>
        (await bucket.getFiles({ prefix: `users/${uid}/` }))[0].length > 0,
    }
  })
})
