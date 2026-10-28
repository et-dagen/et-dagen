import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import formatFirebaseUser from '@/server/utils/formatFirebaseUser'
import { subjectOf } from '@/tests/server/api/support/subject'

// The handlers rely on Nitro's auto-imports; stub them so they run as plain functions.
let stored: Record<string, unknown> = {}
// what the middleware reads to build the subject
let companies: Record<string, { name: string; type: string; cvAccess: boolean }>
const update = vi.fn()

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

beforeEach(async () => {
  vi.resetModules()
  update.mockClear()
  companies = { ours: { name: 'Ours', type: 'partner', cvAccess: false } }
  stored = {
    'companies/ours': { name: 'Ours', type: 'standard', cvAccess: false },
    'companies/ours/cvAccess': false,
    'jobs/j1': { companyUID: 'ours', title: 'Job' },
    users: { student: { resume: 'https://example.com/cv.pdf' } },
  }

  vi.stubGlobal('defineRouteMeta', () => {})
  vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
  vi.stubGlobal('createError', createError)
  vi.stubGlobal('formatFirebaseUser', formatFirebaseUser)
  vi.stubGlobal('getQuery', () => ({ scope: 'all' }))
  for (const name of [
    'setResourceContext',
    'setLogImportance',
    'setErrorContext',
    'addEventContext',
    'trackDbWrite',
    'sendNoContent',
  ]) {
    vi.stubGlobal(name, () => {})
  }
  vi.stubGlobal(
    'withDbTiming',
    (_e: unknown, _p: unknown, _o: unknown, fn: () => unknown) => fn(),
  )
  vi.stubGlobal('db', { ref: reference })
  vi.stubGlobal(
    'companyOf',
    (await import('@/server/utils/companyOf')).companyOf,
  )
  vi.stubGlobal('auth', {
    listUsers: () =>
      Promise.resolve({
        users: [{ uid: 'student', email: 'student@example.com' }],
      }),
  })
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
  vi.stubGlobal('readBody', () => Promise.resolve(body))
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
  it('ignores a company user moving its job to another company', async () => {
    await call('job', company, {
      jobUID: 'j1',
      companyUID: 'theirs',
      title: 'New',
    })
    expect(update).toHaveBeenCalledWith('j1', { title: 'New' })
  })

  it('lets an admin move a job', async () => {
    await call('job', admin, { jobUID: 'j1', companyUID: 'theirs' })
    expect(update).toHaveBeenCalledWith('j1', { companyUID: 'theirs' })
  })
})
