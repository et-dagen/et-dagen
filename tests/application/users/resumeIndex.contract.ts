/**
 * What every {@link ResumeIndex} adapter must do
 *
 * An adapter's test file calls {@link describeResumeIndex} with a factory that seeds the given
 * references, and the profile fields of those users, so the suite runs once per adapter.
 */
import { describe, expect, it } from 'vitest'
import type { ResumeHolder, ResumeIndex } from '@/application/users/resumeIndex'
import { FileId } from '@/domain/files/file'
import { UserUid } from '@/domain/user'

export function describeResumeIndex(
  adapter: string,
  make: (
    seed?: Record<string, string>,
    profiles?: Record<string, Omit<ResumeHolder, 'uid'>>,
  ) => Promise<ResumeIndex> | ResumeIndex,
) {
  describe(`${adapter} ResumeIndex`, () => {
    const kari = UserUid.parse('kari')

    it('points a user at a file and at none', async () => {
      const resumes = await make()
      const file = FileId.random()

      await resumes.set(kari, file)
      expect(await resumes.of(kari)).toBe(file)

      await resumes.set(kari, null)
      expect(await resumes.of(kari)).toBeNull()
    })

    it('returns a link stored before files had records as it is', async () => {
      const link = 'https://storage.googleapis.com/bucket/users/kari/cv.pdf'
      const resumes = await make({ kari: link })
      expect(await resumes.of(kari)).toBe(link)
    })

    it('answers null for a user without one, or with an empty one', async () => {
      const resumes = await make({ kari: '' })
      expect(await resumes.of(kari)).toBeNull()
      expect(await resumes.of(UserUid.parse('ola'))).toBeNull()
    })

    it('lists the users with a résumé, with their name, study programme and year', async () => {
      const resumes = await make(
        { kari: FileId.random(), ola: '' },
        {
          kari: { name: 'Kari', studyProgram: 'MTEL', currentYear: 3 },
          ola: { name: 'Ola', studyProgram: 'BIELEKTRO', currentYear: 1 },
        },
      )
      expect(await resumes.holders()).toEqual([
        { uid: kari, name: 'Kari', studyProgram: 'MTEL', currentYear: 3 },
      ])
    })
  })
}
