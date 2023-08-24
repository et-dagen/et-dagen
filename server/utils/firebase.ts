import { initializeApp, cert, App, getApps, getApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getDatabase } from 'firebase-admin/database'

let firebaseAdminApp: App

if (!getApps().length) {
  firebaseAdminApp = initializeApp({
    credential: cert('firebase-admin.key.json'),
    databaseURL: 'https://etdagen-d1f82.firebaseio.com',
  })
} else {
  firebaseAdminApp = getApp()
}

export const auth = getAuth(firebaseAdminApp)
export const db = getDatabase()
