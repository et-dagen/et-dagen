/* eslint quote-props: 0 */
/* eslint @typescript-eslint/quotes: 0 */
import {
  initializeApp,
  cert,
  App,
  getApps,
  getApp,
  ServiceAccount,
} from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getDatabase } from 'firebase-admin/database'
import { getStorage } from 'firebase-admin/storage'

let firebaseAdminApp: App
const config = useRuntimeConfig()

if (!getApps().length) {
  firebaseAdminApp = initializeApp({
    credential: cert({
      projectId: config.firebaseAdminProjectId,
      clientEmail: config.firebaseAdminClientEmail,
      privateKey: config.firebaseAdminPrivateKey.replace(/\\n/g, '\n'),
    } as ServiceAccount),
    storageBucket: config.firebaseAdminStorageBucket,
    databaseURL: config.public.firebaseDatabaseUrl,
  })
} else {
  firebaseAdminApp = getApp()
}

export const auth = getAuth(firebaseAdminApp)
export const db = getDatabase()
export const storage = getStorage(firebaseAdminApp)
