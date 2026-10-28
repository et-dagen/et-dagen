import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { subjectOf } from '@/tests/server/api/support/subject'

// The handler relies on Nitro's auto-imports; stub them so it runs as a plain function.
const BUCKET = 'demo-bucket'
let stored: Record<string, unknown> = {}
const getSignedUrl = vi.fn()
const sendRedirect = vi.fn()

beforeEach(() => {
  vi.resetModules()
  getSignedUrl.mockReset().mockResolvedValue(['https://signed.example/cv'])
  sendRedirect.mockClear()
  stored = {
    'users/student/resume': `https://storage.googleapis.com/${BUCKET}/users/student/my cv.pdf`,
    'companies/paying/cvAccess': true,
    'companies/free/cvAccess': false,
  }

  vi.stubGlobal('defineRouteMeta', () => {})
  vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
  vi.stubGlobal('createError', createError)
  vi.stubGlobal('sendRedirect', sendRedirect)
  for (const name of [
    'setResourceContext',
    'setLogImportance',
    'setErrorContext',
    'addEventContext',
  ]) {
    vi.stubGlobal(name, () => {})
  }
  vi.stubGlobal(
    'withDbTiming',
    (_e: unknown, _p: unknown, _o: unknown, fn: () => unknown) => fn(),
  )
  vi.stubGlobal('db', {
    ref: (path: string) => ({
      once: () => Promise.resolve({ val: () => stored[path] ?? null }),
    }),
  })
  vi.stubGlobal('storage', {
    bucket: () => ({
      name: BUCKET,
      file: (path: string) => ({
        getSignedUrl: (o: unknown) => getSignedUrl(path, o),
      }),
    }),
  })
})

const COMPANIES = {
  paying: { name: 'Paying', type: 'partner', cvAccess: true },
  free: { name: 'Free', type: 'partner', cvAccess: false },
}

async function open(
  user: ({ uid: string } & Record<string, unknown>) | undefined,
  userUID?: string,
) {
  vi.stubGlobal('getQuery', () => ({ userUID }))
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
    const before = Date.now()
    await open(student, 'student')

    expect(getSignedUrl).toHaveBeenCalledWith('users/student/my cv.pdf', {
      version: 'v4',
      action: 'read',
      expires: expect.any(Number),
    })
    const { expires } = getSignedUrl.mock.calls[0][1] as { expires: number }
    expect(expires - before).toBeGreaterThanOrEqual(5 * 60 * 1000)
    expect(expires - before).toBeLessThan(5 * 60 * 1000 + 1000)
    expect(sendRedirect).toHaveBeenCalledWith(
      expect.anything(),
      'https://signed.example/cv',
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
    expect(getSignedUrl).not.toHaveBeenCalled()
  })

  it('refuses signed-out requests', async () => {
    await expect(open(undefined, 'student')).rejects.toMatchObject({
      code: 'auth/signed-out',
    })
  })

  it('answers 400 without a user and 404 without a resume', async () => {
    await expect(open(admin)).rejects.toMatchObject({ statusCode: 400 })
    await expect(open(admin, 'nobody')).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'Error (resume/not-found).',
    })
  })
})
