import { describe, expect, it, vi } from 'vitest'
import { Instant } from '@/domain/time'
import { eraseUsers } from '@/server/user/erasure'

type Tree = Record<string, unknown>

/** A database holding a plain tree, with the slices of the Admin SDK erasure uses */
function fakeDatabase(tree: Tree) {
  const at = (path: string) =>
    path
      .split('/')
      .reduce<unknown>((node, key) => (node as Tree | undefined)?.[key], tree)
  const set = (path: string, value: unknown) => {
    const keys = path.split('/')
    const parent = keys
      .slice(0, -1)
      .reduce(
        (node, key) => ((node as Tree)[key] ??= {}) as Tree,
        tree as unknown,
      ) as Tree
    if (value === null) delete parent[keys.at(-1)!]
    else parent[keys.at(-1)!] = value
  }
  const ref = (path: string) => ({
    child: (key: string) => ref(`${path}/${key}`),
    orderByChild: (field: string) => ({
      equalTo: (value: unknown) => ({
        once: () => {
          const hits = Object.entries(
            (at(path) as Tree | undefined) ?? {},
          ).filter(([, child]) => (child as Tree)[field] === value)
          return Promise.resolve({
            val: () =>
              hits.length ? structuredClone(Object.fromEntries(hits)) : null,
          })
        },
      }),
    }),
    remove: () => {
      set(path, null)
      return Promise.resolve()
    },
    once: () =>
      Promise.resolve({ val: () => structuredClone(at(path) ?? null) }),
    transaction: (change: (current: unknown) => unknown) => {
      set(path, change(structuredClone(at(path) ?? null)))
      return Promise.resolve()
    },
    update: (values: Record<string, unknown>) => {
      for (const [key, value] of Object.entries(values))
        set(`${path}/${key}`, value)
      return Promise.resolve()
    },
  })
  return { tree, ref }
}

const now = Instant.parse('2026-10-22T12:00:00.000Z')
const RESUME = '0b0c4f5e-8d1a-4c2b-9e3f-1a2b3c4d5e6f'
const LOGO = '1c1d5a6f-9e2b-4d3c-8f4a-2b3c4d5e6f70'
const JOINED = '2d2e6b7a-af3c-4e4d-9a5b-3c4d5e6f7081'
const OTHER = '3e3f7c8b-b04d-4f5e-8b6c-4d5e6f708192'

const invitation = (redeemedBy: string) => ({
  company: 'company',
  email: `${redeemedBy}@company.no`,
  tokenHash: `hash-${redeemedBy}`,
  invitedBy: 'admin',
  createdAt: '2026-10-01T10:00:00.000Z',
  expiresAt: '2026-10-15T10:00:00.000Z',
  redeemedBy,
  redeemedAt: '2026-10-02T10:00:00.000Z',
})

function setup() {
  const record = (ownerKey: string, kind: string) => ({
    ownerKey,
    kind,
    uploader: 'gone',
    name: `${kind}.bin`,
    contentType: kind === 'resume' ? 'application/pdf' : 'image/webp',
    size: 1,
    createdAt: '2026-10-01T10:00:00.000Z',
  })
  const db = fakeDatabase({
    users: { gone: { name: 'Gone' }, kept: { name: 'Kept' } },
    invitations: {
      [JOINED]: invitation('gone'),
      [OTHER]: invitation('kept'),
    },
    files: {
      [RESUME]: record('user:gone', 'resume'),
      [LOGO]: record('company:company', 'logo'),
    },
    events: {
      upcoming: {
        companyUID: 'company',
        date: { start: '2026-11-01T18:00' },
        registration: { start: '2026-10-01T12:00', end: '2026-10-31T12:00' },
        capacity: 1,
        attendants: { gone: { attended: false, registeredAt: 1 } },
        queue: { 1700000000002: 'later', 1700000000001: 'first' },
      },
      queuedOnly: {
        date: { start: '2026-11-02T18:00' },
        attendants: { kept: { attended: false, registeredAt: 1 } },
        queue: { 1700000000001: 'gone' },
      },
      past: {
        date: { start: '2026-01-10T18:00' },
        attendants: { gone: { attended: true, registeredAt: 1 } },
        queue: { 1700000000001: 'waiting' },
      },
      untouched: {
        date: { start: '2026-11-03T18:00' },
        attendants: { kept: {} },
      },
    },
  })
  const files = { deleteFiles: vi.fn(() => Promise.resolve()) }
  const auth = {
    deleteUsers: vi.fn(() =>
      Promise.resolve({ successCount: 1, failureCount: 0, errors: [] }),
    ),
  }
  return { db, files, auth }
}

describe('eraseUsers', () => {
  it('deletes their files, records, invitation joined by, profile and account', async () => {
    const { db, files, auth } = setup()
    await eraseUsers(
      { db: db as never, files, auth: auth as never },
      ['gone'],
      now,
    )

    expect(files.deleteFiles).toHaveBeenCalledWith({ prefix: 'users/gone/' })
    expect(Object.keys(db.tree.files as Tree)).toEqual([LOGO])
    expect(((db.tree.files as Tree)[LOGO] as Tree).uploader).toBeUndefined()
    expect(db.tree.users).toEqual({ kept: { name: 'Kept' } })
    expect(Object.keys(db.tree.invitations as Tree)).toEqual([OTHER])
    expect(auth.deleteUsers).toHaveBeenCalledWith(['gone'])
  })

  it('frees their spot on an upcoming event for the first in the queue', async () => {
    const { db, files, auth } = setup()
    await eraseUsers(
      { db: db as never, files, auth: auth as never },
      ['gone'],
      now,
    )

    const upcoming = (db.tree.events as Tree).upcoming as Tree
    expect(upcoming.attendants).toEqual({
      first: { attended: false, registeredAt: Instant.toDate(now).getTime() },
    })
    expect(upcoming.queue).toEqual({ 1700000000002: 'later' })
  })

  it('promotes nobody while the event is still full after a lowered limit', async () => {
    const { db, files, auth } = setup()
    const events = db.tree.events as Record<string, Tree>
    events.upcoming.attendants = {
      gone: { attended: false, registeredAt: 1 },
      kept: { attended: false, registeredAt: 1 },
    }
    events.upcoming.capacity = 1
    await eraseUsers(
      { db: db as never, files, auth: auth as never },
      ['gone'],
      now,
    )

    expect(Object.keys(events.upcoming.attendants as Tree)).toEqual(['kept'])
    expect(events.upcoming.queue).toEqual({
      1700000000001: 'first',
      1700000000002: 'later',
    })
  })

  it('takes them out of queues, and off past events without promoting anyone', async () => {
    const { db, files, auth } = setup()
    await eraseUsers(
      { db: db as never, files, auth: auth as never },
      ['gone'],
      now,
    )

    const events = db.tree.events as Record<string, Tree>
    expect(events.queuedOnly.queue).toEqual({})
    expect(events.queuedOnly.attendants).toEqual({
      kept: { attended: false, registeredAt: 1 },
    })
    expect(events.past.attendants).toEqual({})
    expect(events.past.queue).toEqual({ 1700000000001: 'waiting' })
    expect(events.untouched).toEqual({
      date: { start: '2026-11-03T18:00' },
      attendants: { kept: {} },
    })
  })

  it('still takes them off an event it cannot read, promoting nobody', async () => {
    const { db, files, auth } = setup()
    const events = db.tree.events as Record<string, Tree>
    delete events.upcoming.companyUID
    await eraseUsers(
      { db: db as never, files, auth: auth as never },
      ['gone'],
      now,
    )

    expect(events.upcoming.attendants).toEqual({})
    expect(Object.values(events.upcoming.queue as Tree)).toEqual([
      'first',
      'later',
    ])
  })

  it('deletes the account last, so a failed run can be repeated', async () => {
    const { db, files, auth } = setup()
    files.deleteFiles.mockRejectedValueOnce(new Error('storage unavailable'))

    await expect(
      eraseUsers(
        { db: db as never, files, auth: auth as never },
        ['gone'],
        now,
      ),
    ).rejects.toThrow('storage unavailable')
    expect(auth.deleteUsers).not.toHaveBeenCalled()

    await eraseUsers(
      { db: db as never, files, auth: auth as never },
      ['gone'],
      now,
    )
    expect(auth.deleteUsers).toHaveBeenCalledOnce()
  })
})
