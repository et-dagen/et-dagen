import { initializeApp, cert, App, getApps, getApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getDatabase } from 'firebase-admin/database'
import { getStorage } from 'firebase-admin/storage'

let firebaseAdminApp: App
const config = useRuntimeConfig()

if (!getApps().length) {
  firebaseAdminApp = initializeApp({
    credential: cert(JSON.parse(config.GOOGLE_APPLICATION_CREDENTIALS)),
    databaseURL: config.public.FB_DB_URL,
    storageBucket: config.public.FB_STORAGE_BUCKET,
  })
} else {
  firebaseAdminApp = getApp()
}

export const auth = getAuth(firebaseAdminApp)
export const db = getDatabase()
export const storage = getStorage(firebaseAdminApp)
