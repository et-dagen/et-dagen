import type { User } from 'firebase/auth'

export default (user: User) => {
  return {
    uid: user.uid,
    email: user.email || '',
    name: user.displayName,
  }
}
