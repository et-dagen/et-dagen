import { initializeApp, cert, App, getApps, getApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getDatabase } from 'firebase-admin/database'

let firebaseAdminApp: App
const config = useRuntimeConfig()

if (!getApps().length) {
  firebaseAdminApp = initializeApp({
    credential: cert(config.GOOGLE_APPLICATION_CREDENTIALS),
    databaseURL: config.public.FB_DB_URL,
  })
} else {
  firebaseAdminApp = getApp()
}

export const auth = getAuth(firebaseAdminApp)
export const db = getDatabase()
