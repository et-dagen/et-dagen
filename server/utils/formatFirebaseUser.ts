import type { User as FirebaseUser } from 'firebase/auth'
import type { UserRecord } from 'firebase-admin/auth'
import type { TokenData } from '@/models/User'

export default (user: FirebaseUser | UserRecord): TokenData => {
  return {
    uid: user.uid,
    email: user.email || '',
    // for some reason the key is called name and not displayName
    // @ts-ignore
    name: user.name,
  }
}
