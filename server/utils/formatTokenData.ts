import type { User as FirebaseUser } from 'firebase/auth'
import type { TokenData } from '@/models/User'

export default (user: FirebaseUser): TokenData => {
  return {
    uid: user.uid,
    email: user.email || '',
    name: user.displayName,
  }
}
