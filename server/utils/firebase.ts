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

let firebaseAdminApp: App
const config = useRuntimeConfig()

if (!getApps().length) {
  firebaseAdminApp = initializeApp({
    credential: cert({
      projectId: config.FB_ADMIN_PROJECT_ID,
      privateKey: config.FB_ADMIN_PRIVATE_KEY,
      clientEmail: config.FB_ADMIN_CLIENT_EMAIL,
    } as ServiceAccount),
    databaseURL: config.public.FB_DB_URL,
  })
} else {
  firebaseAdminApp = getApp()
}

export const auth = getAuth(firebaseAdminApp)
export const db = getDatabase()
