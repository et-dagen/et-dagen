import { beforeEach, describe, expect, it, vi } from 'vitest'
import { subjectOf } from '@/tests/server/api/support/subject'
import type { JobRepository } from '@/application/jobs/jobRepository'
import { JobUid } from '@/domain/business/job'
import { memoryJobRepository } from '@/server/adapters/memory/jobRepository'

// The handlers run as plain functions, with the request and the database faked.
let stored: Record<string, unknown> = {}
// what the middleware reads to build the subject
let companies: Record<string, { name: string; type: string; cvAccess: boolean }>
const update = vi.fn()
const request = { body: {} as object }

const snapshot = (path: string) => {
  const value = stored[path] ?? null
  return {
    val: () =>
      // `orderByKey().equalTo(key)` answers `{ [key]: value }`
      path.split('/').length === 2 && value !== null
        ? { [path.split('/')[1]]: value }
        : value,
  }
}

const reference = (path: string) => {
  const ref = {
    once: () => Promise.resolve(snapshot(path)),
    orderByKey: () => ref,
    equalTo: (key: string) => reference(`${path}/${key}`),
    child: (key: string) => ({ update: (data: unknown) => update(key, data) }),
    update: (data: unknown) => update(path, data),
  }
  return ref
}

beforeEach(() => {
  vi.resetModules()
  update.mockClear()
  companies = { ours: { name: 'Ours', type: 'partner', cvAccess: false } }
  stored = {
    'companies/ours': { name: 'Ours', type: 'standard', cvAccess: false },
    'companies/ours/cvAccess': false,
    users: { student: { resume: 'https://example.com/cv.pdf' } },
  }

  vi.doMock('h3', async (importOriginal) => ({
    ...(await importOriginal<typeof import('h3')>()),
    getQuery: () => ({ scope: 'all' }),
    readBody: () => Promise.resolve(request.body),
    sendNoContent: () => {},
  }))
  vi.doMock('@/server/utils/wideEventHelpers', async (importOriginal) => ({
    ...(await importOriginal<
      typeof import('@/server/utils/wideEventHelpers')
    >()),
    setResourceContext: () => {},
    setLogImportance: () => {},
    setErrorContext: () => {},
    addEventContext: () => {},
    trackDbWrite: () => {},
    withDbTiming: (_e: unknown, _p: unknown, _o: unknown, fn: () => unknown) =>
      fn(),
  }))
  vi.doMock('@/server/utils/firebase', () => ({
    db: { ref: reference },
    auth: {
      listUsers: () =>
        Promise.resolve({
          users: [{ uid: 'student', email: 'student@example.com' }],
        }),
    },
  }))
})

const company = { uid: 'rep', userType: 'company', companyUID: 'ours' }

const admin = { uid: 'boss', userType: 'admin' }

const handlers = {
  company: () => import('@/server/api/v1/company/index.put'),
  job: () => import('@/server/api/v1/job/index.put'),
  resume: () => import('@/server/api/v1/resume/index'),
}

async function call(
  name: keyof typeof handlers,
  user: { uid: string; userType: string; companyUID?: string },
  body = {},
) {
  request.body = body
  const { default: run } = (await handlers[name]()) as unknown as {
    default: (event: unknown) => Promise<unknown>
  }
  return run({
    context: {
      user,
      subject: subjectOf(user, companies),
      decodedToken: { uid: 'x' },
    },
  })
}

describe('PUT /api/v1/company', () => {
  it('ignores a company user setting résumé access or type', async () => {
    await call('company', company, {
      companyUID: 'ours',
      name: 'Renamed',
      cvAccess: true,
      type: 'main',
    })
    expect(update).toHaveBeenCalledWith('ours', { name: 'Renamed' })
  })

  it('keeps résumé access out of an admin update too; it is set with /affiliation', async () => {
    await call('company', admin, {
      companyUID: 'ours',
      name: 'Renamed',
      cvAccess: true,
    })
    expect(update).toHaveBeenCalledWith('ours', { name: 'Renamed' })
  })
})

describe('GET /api/v1/resume?scope=all', () => {
  it('gives a company without résumé access only its own record', async () => {
    expect(await call('resume', company)).toEqual(company)
  })

  it('lists résumés for a company with résumé access', async () => {
    companies.ours.cvAccess = true
    expect(await call('resume', company)).toEqual([
      expect.objectContaining({ uid: 'student' }),
    ])
  })

  it('lists résumés for an admin', async () => {
    expect(await call('resume', admin)).toEqual([
      expect.objectContaining({ uid: 'student' }),
    ])
  })
})

describe('PUT /api/v1/job', () => {
  // the handler writes through the JobRepository, so the stored job is what to check
  let jobs: JobRepository
  beforeEach(() => {
    jobs = memoryJobRepository({ j1: { companyUID: 'ours', title: 'Job' } })
    vi.doMock('@/server/composition', () => ({ jobs }))
  })
  const j1 = JobUid.parse('j1')

  it('ignores a company user moving its job to another company', async () => {
    await call('job', company, {
      jobUID: 'j1',
      companyUID: 'theirs',
      title: 'New',
    })
    expect(await jobs.storedOne(j1)).toEqual({
      companyUID: 'ours',
      title: 'New',
    })
  })

  it('lets an admin move a job', async () => {
    await call('job', admin, { jobUID: 'j1', companyUID: 'theirs' })
    expect(await jobs.storedOne(j1)).toEqual({
      companyUID: 'theirs',
      title: 'Job',
    })
  })
})
