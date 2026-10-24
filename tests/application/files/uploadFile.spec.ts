import { describe, expect, it } from 'vitest'
import {
  eraseOwnerFiles,
  uploadFile,
  type Upload,
} from '@/application/files/uploadFile'
import { AppError } from '@/domain/errors'
import { storagePathOf } from '@/domain/files/file'
import { Instant } from '@/domain/time/instant'
import { UserUid } from '@/domain/user'
import { memoryFileRepository } from '@/server/adapters/memory/fileRepository'
import { memoryFileStorage } from '@/server/adapters/memory/fileStorage'

const ada = UserUid.parse('ada')
const pdf = new Uint8Array([37, 80, 68, 70])

const setup = () => {
  let tick = 0
  const deps = {
    files: memoryFileRepository(),
    storage: memoryFileStorage(),
    // each upload a minute after the last, so newest-first is well defined
    now: () => Instant.of(new Date(Date.UTC(2026, 9, 25, 10, tick++))),
  }
  return deps
}

const resume = (name = 'CV.pdf'): Upload => ({
  kind: 'resume',
  owner: { kind: 'user', uid: ada },
  uploader: ada,
  name,
  contentType: 'application/pdf',
  bytes: pdf,
})

describe('uploadFile', () => {
  it('stores the bytes at the owner-keyed path and records the file', async () => {
    const deps = setup()
    const file = await uploadFile(resume('Min CV (endelig).pdf'), deps)

    const path = storagePathOf(file)
    expect(path).toBe(`users/ada/resumes/${file.id}.pdf`)
    expect(deps.storage.files.get(path)).toMatchObject({
      contentType: 'application/pdf',
      public: false,
      metadata: { fileId: file.id, owner: 'user:ada', uploader: 'ada' },
    })
    expect(await deps.files.find(file.id)).toMatchObject({
      name: 'Min CV (endelig).pdf',
      size: 4,
      uploader: ada,
    })
  })

  it('keeps only the newest résumé', async () => {
    const deps = setup()
    const first = await uploadFile(resume(), deps)
    const second = await uploadFile(resume(), deps)

    expect(await deps.files.ofOwner({ kind: 'user', uid: ada })).toEqual([
      second,
    ])
    expect(deps.storage.files.has(storagePathOf(first))).toBe(false)
  })

  it('refuses a file its kind does not allow, storing nothing', async () => {
    const deps = setup()
    await expect(
      uploadFile({ ...resume(), contentType: 'text/html' }, deps),
    ).rejects.toMatchObject({ code: 'file/unsupported-type' })
    await expect(
      uploadFile({ ...resume(), bytes: new Uint8Array() }, deps),
    ).rejects.toBeInstanceOf(AppError)
    expect(deps.storage.files.size).toBe(0)
  })

  it('takes the bytes back when the record cannot be saved', async () => {
    const deps = setup()
    deps.files.save = () => Promise.reject(new Error('database down'))

    await expect(uploadFile(resume(), deps)).rejects.toThrow('database down')
    expect(deps.storage.files.size).toBe(0)
  })
})

describe('eraseOwnerFiles', () => {
  it("removes every file of the owner and nobody else's", async () => {
    const deps = setup()
    await uploadFile(resume(), deps)
    await uploadFile(
      { ...resume(), kind: 'avatar', contentType: 'image/png', name: 'me.png' },
      deps,
    )
    const bo = UserUid.parse('bo')
    await uploadFile(
      { ...resume(), owner: { kind: 'user', uid: bo }, uploader: bo },
      deps,
    )

    expect(await eraseOwnerFiles({ kind: 'user', uid: ada }, deps)).toBe(2)
    expect(await deps.files.ofOwner({ kind: 'user', uid: ada })).toEqual([])
    expect(deps.storage.files.size).toBe(1)
  })
})
