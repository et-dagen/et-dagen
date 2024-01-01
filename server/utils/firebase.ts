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

let firebaseAdminApp: App
const config = useRuntimeConfig()

if (!getApps().length) {
  firebaseAdminApp = initializeApp({
    credential: cert({
      "project_id": `${config.FB_ADMIN_PROJECT_ID}`,
      clientEmail: `${config.FB_ADMIN_CLIENT_EMAIL}`,
      "private_key": `${config.FB_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')}`,
    } as ServiceAccount),
    databaseURL: config.public.FB_DB_URL,
  })
} else {
  firebaseAdminApp = getApp()
}

export const auth = getAuth(firebaseAdminApp)
export const db = getDatabase()
