import type { UserUid } from '@/domain/user'

/** Where user profiles are stored */
export interface UserRepository {
  /** Delete the profiles. Profiles that are already gone count as deleted. */
  remove(users: readonly UserUid[]): Promise<void>
}
