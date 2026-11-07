import type { ResumeHolder, ResumeIndex } from '@/application/users/resumeIndex'
import { UserUid } from '@/domain/user'

type Profile = Partial<Omit<ResumeHolder, 'uid'>>

/** Résumé references held in a map, for tests; `profiles` gives holders their fields */
export function memoryResumeIndex(
  seed: Readonly<Record<string, string>> = {},
  profiles: Readonly<Record<string, Profile>> = {},
): ResumeIndex {
  const resumes = new Map<string, string>(Object.entries(seed))
  return {
    of: (user: UserUid) => Promise.resolve(resumes.get(user) || null),
    set: (user, file) => {
      if (file) resumes.set(user, file)
      else resumes.delete(user)
      return Promise.resolve()
    },
    holders: () =>
      Promise.resolve(
        [...resumes]
          .filter(([, reference]) => reference)
          .map(([uid]) => ({
            uid: UserUid.parse(uid),
            name: profiles[uid]?.name ?? null,
            studyProgram: profiles[uid]?.studyProgram ?? null,
            currentYear: profiles[uid]?.currentYear ?? null,
          })),
      ),
  }
}
