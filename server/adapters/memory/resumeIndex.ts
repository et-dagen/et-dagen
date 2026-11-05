import type { ResumeIndex } from '@/application/users/resumeIndex'
import type { UserUid } from '@/domain/user'

/** Résumé references held in a map, for tests */
export function memoryResumeIndex(
  seed: Readonly<Record<string, string>> = {},
): ResumeIndex {
  const resumes = new Map<string, string>(Object.entries(seed))
  return {
    of: (user: UserUid) => Promise.resolve(resumes.get(user) || null),
    set: (user, file) => {
      if (file) resumes.set(user, file)
      else resumes.delete(user)
      return Promise.resolve()
    },
  }
}
