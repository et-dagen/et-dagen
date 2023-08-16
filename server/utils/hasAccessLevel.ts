import type { User } from '@/models/User'

export default (user: User, accessLevel: string): boolean => {
  return user?.accessLevel?.includes(accessLevel) ?? false
}
