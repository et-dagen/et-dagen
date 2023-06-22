import {
  initializeApp,
  applicationDefault,
  App,
  getApps,
  getApp,
} from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

let firebaseAdminApp: App

if (!getApps().length) {
  firebaseAdminApp = initializeApp({
    // uses environment variable GOOGLE_APPLICATION_CREDENTIALS
    credential: applicationDefault(),
  })
} else {
  firebaseAdminApp = getApp()
}

export const auth = getAuth(firebaseAdminApp)
