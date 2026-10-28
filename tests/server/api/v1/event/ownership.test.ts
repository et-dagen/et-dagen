import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Subject } from '@/domain/authorization/subject'
import { CompanyUid } from '@/domain/business/company'
import { UserUid } from '@/domain/user'

// The handlers rely on Nitro's auto-imports; stub them so they run as plain functions.
const owners: Record<string, string> = {}
const remove = vi.fn()
const update = vi.fn()
const sendNoContent = vi.fn()

beforeEach(async () => {
  vi.resetModules()
  for (const key of Object.keys(owners)) delete owners[key]
  owners['events/theirs/companyUID'] = 'other-company'
  owners['events/ours/companyUID'] = 'our-company'
  remove.mockClear()
  update.mockClear()
  sendNoContent.mockClear()

  vi.stubGlobal('defineRouteMeta', () => {})
  vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
  vi.stubGlobal('createError', createError)
  vi.stubGlobal('sendNoContent', sendNoContent)
  for (const name of [
    'setResourceContext',
    'setLogImportance',
    'setErrorContext',
    'addEventContext',
    'trackDbWrite',
    'trackDbDelete',
  ]) {
    vi.stubGlobal(name, () => {})
  }
  vi.stubGlobal(
    'withDbTiming',
    (_e: unknown, _p: unknown, _o: unknown, fn: () => unknown) => fn(),
  )
  vi.stubGlobal('db', {
    ref: (path: string) => ({
      once: () => Promise.resolve({ val: () => owners[path] ?? null }),
      child: () => ({ remove }),
      remove,
      update,
      // the queue check after an update; its outcome is the repository's business
      transaction: () => Promise.resolve(),
    }),
  })
  const owner = await import('@/server/utils/eventOwner')
  vi.stubGlobal('authorizeStoredEvent', owner.authorizeStoredEvent)
  vi.stubGlobal(
    'companyOf',
    (await import('@/server/utils/companyOf')).companyOf,
  )
})

const company: Subject = {
  uid: UserUid.parse('rep'),
  roles: ['company'],
  companies: new Map([
    [CompanyUid.parse('our-company'), new Set(['ent:event:manage'] as const)],
  ]),
  applicant: null,
}
const admin: Subject = {
  uid: UserUid.parse('boss'),
  roles: ['admin'],
  companies: new Map(),
  applicant: null,
}

const handlers = {
  'index.delete': () => import('@/server/api/v1/event/index.delete'),
  'index.put': () => import('@/server/api/v1/event/index.put'),
}

async function call(
  handler: keyof typeof handlers,
  subject: Subject,
  body: object,
) {
  vi.stubGlobal('readBody', () => Promise.resolve(body))
  const { default: run } = (await handlers[handler]()) as unknown as {
    default: (event: unknown) => Promise<unknown>
  }
  return run({ context: { subject } })
}

const eventFields = {
  capacity: 10,
  date: { start: '2026-02-01T10:00', end: '2026-02-01T12:00' },
  description: 'Talk',
  location: { name: 'Room', map: null },
  title: 'Talk',
  registration: { start: '2026-01-01T10:00', end: '2026-01-02T10:00' },
}

describe('DELETE /api/v1/event', () => {
  it("refuses a company user deleting another company's event", async () => {
    await expect(
      call('index.delete', company, {
        eventUID: 'theirs',
        companyUID: 'our-company',
      }),
    ).rejects.toMatchObject({ code: 'auth/forbidden' })
    expect(remove).not.toHaveBeenCalled()
  })

  it('refuses a company user deleting an event that does not exist', async () => {
    await expect(
      call('index.delete', company, {
        eventUID: 'missing',
        companyUID: 'our-company',
      }),
    ).rejects.toMatchObject({ statusCode: 404 })
    expect(remove).not.toHaveBeenCalled()
  })

  it("lets a company user delete their own company's event", async () => {
    await call('index.delete', company, {
      eventUID: 'ours',
      companyUID: 'our-company',
    })
    expect(remove).toHaveBeenCalledOnce()
  })

  it('lets an admin delete any event', async () => {
    await call('index.delete', admin, { eventUID: 'theirs' })
    expect(remove).toHaveBeenCalledOnce()
  })
})

describe('PUT /api/v1/event', () => {
  it("refuses a company user overwriting another company's event", async () => {
    await expect(
      call('index.put', company, {
        ...eventFields,
        eventUID: 'theirs',
        companyUID: 'our-company',
      }),
    ).rejects.toMatchObject({ code: 'auth/forbidden' })
    expect(update).not.toHaveBeenCalled()
  })

  it('refuses a company user creating an event through an update', async () => {
    await expect(
      call('index.put', company, {
        ...eventFields,
        eventUID: 'missing',
        companyUID: 'our-company',
      }),
    ).rejects.toMatchObject({ statusCode: 404 })
    expect(update).not.toHaveBeenCalled()
  })

  it("lets a company user update their own company's event", async () => {
    await call('index.put', company, {
      ...eventFields,
      eventUID: 'ours',
      companyUID: 'our-company',
    })
    expect(update).toHaveBeenCalledOnce()
  })

  it('lets an admin update any event', async () => {
    await call('index.put', admin, {
      ...eventFields,
      eventUID: 'theirs',
      companyUID: 'other-company',
    })
    expect(update).toHaveBeenCalledOnce()
  })
})
