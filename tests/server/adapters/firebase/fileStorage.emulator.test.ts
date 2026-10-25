/**
 * Runs the FileStorage contract against the Cloud Storage emulator
 *
 * Needs `FIREBASE_STORAGE_EMULATOR_HOST`, which `bun run test:api` sets; skipped without it.
 */
import { initializeApp } from 'firebase-admin/app'
import { getStorage } from 'firebase-admin/storage'
import { describe } from 'vitest'
import { describeFileStorage } from '@/tests/application/files/fileStorage.contract'
import { firebaseFileStorage } from '@/server/adapters/firebase/fileStorage'

const host = process.env.FIREBASE_STORAGE_EMULATOR_HOST

describe.skipIf(!host)('Cloud Storage emulator', () => {
  const bucket = getStorage(
    initializeApp(
      {
        projectId: 'demo-et-dagen',
        storageBucket: 'demo-et-dagen.appspot.com',
      },
      'file-storage-contract',
    ),
  ).bucket()

  describeFileStorage('firebase', () => firebaseFileStorage(bucket))
})
