import type { User as FirebaseUser } from 'firebase/auth'
import type { User } from '@/models/User'

export default (user: FirebaseUser): User => {
  return {
    uid: user.uid,
    email: user.email || '',
    name: user.displayName,
  }
}
