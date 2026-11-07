import { describe, expect, it } from 'vitest'
import {
  listResumes,
  openResume,
  removeResume,
  uploadResume,
} from '@/application/users/resume'
import type { Subject } from '@/domain/authorization/subject'
import { AppError } from '@/domain/errors'
import { storagePathOf } from '@/domain/files/file'
import { Instant } from '@/domain/time'
import { UserUid, type Role } from '@/domain/user'
import { memoryFileRepository } from '@/server/adapters/memory/fileRepository'
import { memoryFileStorage } from '@/server/adapters/memory/fileStorage'
import { memoryResumeIndex } from '@/server/adapters/memory/resumeIndex'
import { memoryUserDirectory } from '@/server/adapters/memory/userDirectory'

const kari = UserUid.parse('kari')
const now = Instant.parse('2026-11-05T10:00:00.000Z')
const pdf = new Uint8Array([37, 80, 68, 70])

const subject = (uid: string, roles: Role[] = ['user']): Subject => ({
  uid: UserUid.parse(uid),
  roles,
  companies: new Map(),
  applicant: null,
})
const owner = subject('kari')

const setup = (references: Record<string, string> = {}) => ({
  files: memoryFileRepository(),
  storage: memoryFileStorage(),
  resumes: memoryResumeIndex(references),
  now: () => now,
})
const upload = {
  now,
  owner: kari,
  name: 'CV.pdf',
  contentType: 'application/pdf',
  bytes: pdf,
}

/** A link as v1 stored it, before files had records */
const legacy = (path: string) => `memory://${path}`

const codeOf = (promise: Promise<unknown>) =>
  promise.then(
    () => null,
    (error: unknown) => (error instanceof AppError ? error.code : error),
  )

describe('uploadResume', () => {
  it("stores the file as the user's own and points the profile at it", async () => {
    const deps = setup()
    const file = await uploadResume(deps, { ...upload, subject: owner })

    expect(await deps.resumes.of(kari)).toBe(file.id)
    expect(deps.storage.files.has(`users/kari/resumes/${file.id}.pdf`)).toBe(
      true,
    )
    expect(await openResume(deps, { subject: owner, now, owner: kari })).toBe(
      `memory://${storagePathOf(file)}?expires=300`,
    )
  })

  it('removes the earlier résumé, recorded or from before records', async () => {
    const deps = setup({ kari: legacy('users/kari/cv.pdf') })
    await deps.storage.put('users/kari/cv.pdf', pdf, {
      contentType: 'application/pdf',
      public: false,
      metadata: {},
    })

    const first = await uploadResume(deps, { ...upload, subject: owner })
    expect(deps.storage.files.has('users/kari/cv.pdf')).toBe(false)

    const second = await uploadResume(deps, { ...upload, subject: owner })
    expect(await deps.files.find(first.id)).toBeNull()
    expect([...deps.storage.files.keys()]).toEqual([storagePathOf(second)])
  })

  it('refuses another user and a file that is not a PDF', async () => {
    const deps = setup()
    expect(
      await codeOf(uploadResume(deps, { ...upload, subject: subject('ola') })),
    ).toBe('auth/forbidden')
    expect(
      await codeOf(
        uploadResume(deps, {
          ...upload,
          subject: owner,
          contentType: 'text/plain',
        }),
      ),
    ).toBe('file/unsupported-type')
    expect(await deps.resumes.of(kari)).toBeNull()
  })
})

describe('openResume', () => {
  it('opens a résumé stored before files had records', async () => {
    const deps = setup({ kari: legacy('users/kari/cv.pdf') })
    expect(await openResume(deps, { subject: owner, now, owner: kari })).toBe(
      'memory://users/kari/cv.pdf?expires=300',
    )
  })

  it('finds no résumé behind a link outside the user folder', async () => {
    const deps = setup({ kari: legacy('users/ola/cv.pdf') })
    expect(
      await codeOf(openResume(deps, { subject: owner, now, owner: kari })),
    ).toBe('resume/not-found')
  })

  it('lets an admin open it, but not another student or a signed-out caller', async () => {
    const deps = setup({ kari: legacy('users/kari/cv.pdf') })
    const read = (who: Subject | undefined) =>
      codeOf(openResume(deps, { subject: who, now, owner: kari }))

    expect(await read(subject('boss', ['admin']))).toBeNull()
    expect(await read(subject('ola'))).toBe('auth/forbidden')
    expect(await read(undefined)).toBe('auth/signed-out')
  })
})

describe('removeResume', () => {
  it('removes a recorded résumé and its record', async () => {
    const deps = setup()
    const file = await uploadResume(deps, { ...upload, subject: owner })
    await removeResume(deps, { subject: owner, now, owner: kari })

    expect(await deps.resumes.of(kari)).toBeNull()
    expect(await deps.files.find(file.id)).toBeNull()
    expect(deps.storage.files.size).toBe(0)
  })

  it('removes a résumé stored before files had records', async () => {
    const deps = setup({ kari: legacy('users/kari/cv.pdf') })
    await deps.storage.put('users/kari/cv.pdf', pdf, {
      contentType: 'application/pdf',
      public: false,
      metadata: {},
    })
    await removeResume(deps, { subject: owner, now, owner: kari })

    expect(await deps.resumes.of(kari)).toBeNull()
    expect(deps.storage.files.size).toBe(0)
  })

  it('answers not found when there is none, and leaves other folders alone', async () => {
    const deps = setup({ kari: legacy('users/ola/cv.pdf') })
    await deps.storage.put('users/ola/cv.pdf', pdf, {
      contentType: 'application/pdf',
      public: false,
      metadata: {},
    })

    expect(
      await codeOf(removeResume(deps, { subject: owner, now, owner: kari })),
    ).toBe('resume/not-found')
    expect(deps.storage.files.has('users/ola/cv.pdf')).toBe(true)
  })
})

describe('listResumes', () => {
  const ola = UserUid.parse('ola')
  const deps = {
    resumes: memoryResumeIndex(
      { kari: 'file-1', ola: 'file-2', gone: 'file-3' },
      { kari: { name: 'Kari', studyProgram: 'MTEL', currentYear: 3 } },
    ),
    users: memoryUserDirectory(
      [kari, ola],
      new Map([
        [kari, { name: 'Kari N', email: 'kari@example.com' }],
        [ola, { name: 'Ola', email: 'ola@example.com' }],
      ]),
    ),
  }

  it('lists each résumé with an account, the profile name first', async () => {
    const admin = subject('boss', ['admin'])
    expect(await listResumes(deps, { subject: admin, now })).toEqual([
      {
        uid: kari,
        name: 'Kari',
        email: 'kari@example.com',
        studyProgram: 'MTEL',
        currentYear: 3,
      },
      {
        uid: ola,
        name: 'Ola',
        email: 'ola@example.com',
        studyProgram: null,
        currentYear: null,
      },
    ])
  })

  it('refuses a student and a signed-out caller', async () => {
    expect(await codeOf(listResumes(deps, { subject: owner, now }))).toBe(
      'auth/forbidden',
    )
    expect(await codeOf(listResumes(deps, { subject: undefined, now }))).toBe(
      'auth/signed-out',
    )
  })
})
