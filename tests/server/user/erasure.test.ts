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
  return {
    tree,
    ref: (path: string) => ({
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
    }),
  }
}

const now = Instant.parse('2026-10-22T12:00:00.000Z')

function setup() {
  const db = fakeDatabase({
    users: { gone: { name: 'Gone' }, kept: { name: 'Kept' } },
    events: {
      upcoming: {
        date: { start: '2026-11-01T18:00' },
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
  it('deletes the résumé files, the profile and the account', async () => {
    const { db, files, auth } = setup()
    await eraseUsers(
      { db: db as never, files, auth: auth as never },
      ['gone'],
      now,
    )

    expect(files.deleteFiles).toHaveBeenCalledWith({ prefix: 'users/gone/' })
    expect(db.tree.users).toEqual({ kept: { name: 'Kept' } })
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
