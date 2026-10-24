/**
 * What every {@link FileRepository} adapter must do
 *
 * An adapter's test file calls {@link describeFileRepository} with a factory, so the suite runs
 * once per adapter.
 */
import { describe, expect, it } from 'vitest'
import type { FileRepository } from '@/application/files/fileRepository'
import { CompanyUid } from '@/domain/business/company'
import { FileId, type StoredFile } from '@/domain/files/file'
import { Instant } from '@/domain/time/instant'
import { UserUid } from '@/domain/user'

const ada = UserUid.parse('ada')
const bo = UserUid.parse('bo')
const polarbit = CompanyUid.parse('polarbit')

const file = (overrides: Partial<StoredFile> = {}): StoredFile => ({
  id: FileId.random(),
  owner: { kind: 'user', uid: ada },
  kind: 'resume',
  uploader: ada,
  name: 'CV.pdf',
  contentType: 'application/pdf',
  size: 1234,
  createdAt: Instant.parse('2026-10-01T10:00:00.000Z'),
  ...overrides,
})

export function describeFileRepository(
  adapter: string,
  make: () => Promise<FileRepository> | FileRepository,
) {
  describe(`${adapter} FileRepository`, () => {
    it('saves, finds and removes a record', async () => {
      const files = await make()
      const cv = file()
      await files.save(cv)
      expect(await files.find(cv.id)).toEqual(cv)

      await files.remove(cv.id)
      expect(await files.find(cv.id)).toBeNull()
      await files.remove(cv.id)
    })

    it("lists an owner's files, newest first, of one kind when asked", async () => {
      const files = await make()
      const older = file({
        createdAt: Instant.parse('2026-09-01T10:00:00.000Z'),
      })
      const newer = file()
      const avatar = file({
        kind: 'avatar',
        contentType: 'image/png',
        name: 'me.png',
      })
      const theirs = file({ owner: { kind: 'user', uid: bo }, uploader: bo })
      const logo = file({
        owner: { kind: 'company', uid: polarbit },
        kind: 'logo',
        contentType: 'image/png',
      })
      for (const f of [older, newer, avatar, theirs, logo]) await files.save(f)

      expect(
        (await files.ofOwner({ kind: 'user', uid: ada }, 'resume')).map(
          (f) => f.id,
        ),
      ).toEqual([newer.id, older.id])
      expect(await files.ofOwner({ kind: 'user', uid: ada })).toHaveLength(3)
      expect(await files.ofOwner({ kind: 'company', uid: polarbit })).toEqual([
        logo,
      ])
      expect(await files.ofOwner({ kind: 'fair' })).toEqual([])
    })

    it('forgets an erased uploader but keeps the file with its owner', async () => {
      const files = await make()
      const logo = file({
        owner: { kind: 'company', uid: polarbit },
        kind: 'logo',
        contentType: 'image/png',
      })
      await files.save(logo)

      expect(await files.clearUploader(ada)).toBe(1)
      expect(await files.find(logo.id)).toEqual({ ...logo, uploader: null })
      expect(await files.clearUploader(ada)).toBe(0)
    })
  })
}
