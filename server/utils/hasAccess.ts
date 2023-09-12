import type { User } from '@/models/User'

export default (user: User, accessLevels: string[]): boolean => {
  return accessLevels.includes(user?.userType) ?? false
}
