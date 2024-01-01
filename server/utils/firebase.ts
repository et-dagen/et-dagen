<<<<<<< HEAD
=======
/* eslint quote-props: 0 */
/* eslint @typescript-eslint/quotes: 0 */
>>>>>>> 5f61d539cf88989ad8f5b8ec9923491a91165ff0
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
      "type": config.FB_ADMIN_TYPE,
      "project_id": config.FB_ADMIN_PROJECT_ID,
      "private_key_id": config.FB_ADMIN_PRIVATE_KEY_ID,
      "private_key": config.FB_ADMIN_PRIVATE_KEY,
      "client_email": config.FB_ADMIN_CLIENT_EMAIL,
      "client_id": config.FB_ADMIN_CLIENT_ID,
      "auth_uri": config.FB_ADMIN_AUTH_URI,
      "token_uri": config.FB_ADMIN_TOKEN_URI,
      "auth_provider_x509_cert_url": config.FB_ADMIN_AUTH_PROVIDER_CERL_URL,
      "client_x509_cert_url": config.FB_ADMIN_CLIENT_CERT_URL,
      "universe_domain": config.FB_ADMIN_UNIVERSE_DOMAIN,
    } as ServiceAccount),
    databaseURL: config.public.FB_DB_URL,
  })
} else {
  firebaseAdminApp = getApp()
}

export const auth = getAuth(firebaseAdminApp)
export const db = getDatabase()
