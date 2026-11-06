import { beforeEach, describe, expect, it, vi } from 'vitest'
import { subjectOf } from '@/tests/server/api/support/subject'
import { memoryFileRepository } from '@/server/adapters/memory/fileRepository'
import { memoryFileStorage } from '@/server/adapters/memory/fileStorage'
import { memoryResumeIndex } from '@/server/adapters/memory/resumeIndex'

// The handler runs as a plain function. Its ports are the in-memory adapters, where a link stored
// before files had records starts `memory://`.
const { sendRedirect, request } = vi.hoisted(() => ({
  sendRedirect: vi.fn(),
  request: { query: {} as Record<string, unknown> },
}))

vi.mock('h3', async (importOriginal) => ({
  ...(await importOriginal<typeof import('h3')>()),
  getQuery: () => request.query,
  sendRedirect,
}))
vi.mock('@/server/utils/wideEventHelpers', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/server/utils/wideEventHelpers')>()),
  setResourceContext: () => {},
  setLogImportance: () => {},
  setErrorContext: () => {},
  addEventContext: () => {},
}))

beforeEach(() => {
  vi.resetModules()
  sendRedirect.mockClear()
  vi.doMock('@/server/composition', () => ({
    files: memoryFileRepository(),
    fileStorage: memoryFileStorage(),
    resumes: memoryResumeIndex({
      student: 'memory://users/student/my%20cv.pdf',
    }),
  }))
})

const COMPANIES = {
  paying: { name: 'Paying', type: 'partner', cvAccess: true },
  free: { name: 'Free', type: 'partner', cvAccess: false },
}

async function open(
  user: ({ uid: string } & Record<string, unknown>) | undefined,
  userUID?: string,
) {
  request.query = { userUID }
  const { default: run } =
    (await import('@/server/api/v1/resume/file.get')) as unknown as {
      default: (event: unknown) => Promise<unknown>
    }
  return run({
    context: { subject: user && subjectOf(user, COMPANIES) },
  })
}

const student = { uid: 'student', userType: 'basic' }
const otherStudent = { uid: 'other', userType: 'basic' }
const admin = { uid: 'boss', userType: 'admin' }
const paying = { uid: 'rep', userType: 'company', companyUID: 'paying' }
const free = { uid: 'rep2', userType: 'company', companyUID: 'free' }

describe('GET /api/v1/resume/file', () => {
  it('redirects the owner to a link that expires in five minutes', async () => {
    await open(student, 'student')

    expect(sendRedirect).toHaveBeenCalledWith(
      expect.anything(),
      'memory://users/student/my cv.pdf?expires=300',
      302,
    )
  })

  it('lets admins and companies with CV access open it', async () => {
    await open(admin, 'student')
    await open(paying, 'student')
    expect(sendRedirect).toHaveBeenCalledTimes(2)
  })

  it('refuses other students and companies without CV access', async () => {
    for (const user of [otherStudent, free]) {
      await expect(open(user, 'student')).rejects.toMatchObject({
        code: 'auth/forbidden',
      })
    }
    expect(sendRedirect).not.toHaveBeenCalled()
  })

  it('refuses signed-out requests', async () => {
    await expect(open(undefined, 'student')).rejects.toMatchObject({
      code: 'auth/signed-out',
    })
  })

  it('answers 400 without a user and 404 without a resume', async () => {
    await expect(open(admin)).rejects.toMatchObject({ statusCode: 400 })
    await expect(open(admin, 'nobody')).rejects.toMatchObject({
      code: 'resume/not-found',
    })
  })
})
