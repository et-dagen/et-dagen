import { describe, expect, it, vi } from 'vitest'
import { Instant } from '@/domain/time'
import { memoryMailer } from '@/server/adapters/memory/mailer'
import {
  lastActive,
  retainedAccounts,
  runRetention,
} from '@/server/user/retention'

const now = Instant.parse('2026-10-24T03:00:00.000Z')

/** An account as Firebase Auth lists it, with only the fields retention reads */
const account = (
  uid: string,
  {
    email = `${uid}@example.com`,
    ...metadata
  }: {
    email?: string
    creationTime: string
    lastSignInTime?: string
    lastRefreshTime?: string | null
  },
) => ({ uid, email, metadata })

const STALE = account('stale', {
  email: 'stale@example.com',
  creationTime: 'Mon, 01 Jun 2020 10:00:00 GMT',
  lastSignInTime: 'Fri, 01 Oct 2021 10:00:00 GMT',
})
const SIGNED_IN = account('signed-in', {
  creationTime: 'Mon, 01 Jun 2020 10:00:00 GMT',
  lastSignInTime: 'Sun, 01 Jun 2025 10:00:00 GMT',
})
// erased on 2026-11-10, so within 30 days of `now`
const DUE = account('due', {
  creationTime: 'Mon, 01 Jun 2020 10:00:00 GMT',
  lastSignInTime: 'Fri, 10 Nov 2023 10:00:00 GMT',
})
const STAYED_SIGNED_IN = account('stayed-signed-in', {
  creationTime: 'Mon, 01 Jun 2020 10:00:00 GMT',
  lastSignInTime: 'Mon, 01 Jun 2020 10:00:00 GMT',
  lastRefreshTime: '2026-10-01T08:00:00.000Z',
})

/** Firebase Auth's listUsers, serving the accounts in pages of two */
const listing = (accounts: unknown[]) =>
  vi.fn((_max: number, pageToken?: string) => {
    const start = Number(pageToken ?? 0)
    const next = start + 2
    return Promise.resolve({
      users: accounts.slice(start, next),
      pageToken: next < accounts.length ? String(next) : undefined,
    })
  })

describe('lastActive', () => {
  it('takes the latest of creation, sign-in and token refresh', () => {
    expect(lastActive(STAYED_SIGNED_IN as never)).toBe(
      '2026-10-01T08:00:00.000Z',
    )
    expect(lastActive(SIGNED_IN as never)).toBe('2025-06-01T10:00:00.000Z')
  })

  it('counts the creation time for an account that never signed in', () => {
    const created = account('created', {
      creationTime: 'Mon, 01 Jun 2020 10:00:00 GMT',
      lastRefreshTime: null,
    })

    expect(lastActive(created as never)).toBe('2020-06-01T10:00:00.000Z')
  })
})

describe('retainedAccounts', () => {
  it('reads every page, with each address and last activity', async () => {
    const listUsers = listing([SIGNED_IN, STALE, STAYED_SIGNED_IN])

    expect(await retainedAccounts({ listUsers } as never)).toEqual([
      {
        uid: 'signed-in',
        email: 'signed-in@example.com',
        lastActive: '2025-06-01T10:00:00.000Z',
      },
      {
        uid: 'stale',
        email: 'stale@example.com',
        lastActive: '2021-10-01T10:00:00.000Z',
      },
      {
        uid: 'stayed-signed-in',
        email: 'stayed-signed-in@example.com',
        lastActive: '2026-10-01T08:00:00.000Z',
      },
    ])
    expect(listUsers).toHaveBeenCalledTimes(2)
  })
})

describe('runRetention', () => {
  it('warns the users due, erases the inactive ones and reports how many', async () => {
    const auth = {
      listUsers: listing([STALE, SIGNED_IN, DUE]),
      deleteUsers: vi.fn(() =>
        Promise.resolve({ successCount: 1, failureCount: 0, errors: [] }),
      ),
    }
    const update = vi.fn(() => Promise.resolve())
    const set = vi.fn(() => Promise.resolve())
    const db = {
      ref: () => {
        const empty = { once: () => Promise.resolve({ val: () => null }) }
        // no file records: the stale user uploaded nothing that was recorded
        return {
          ...empty,
          orderByChild: () => ({ equalTo: () => empty }),
          update,
          set,
        }
      },
    }
    const files = { deleteFiles: vi.fn(() => Promise.resolve()) }

    const mailer = memoryMailer()

    const counts = await runRetention(
      { db: db as never, files, auth: auth as never, mailer },
      now,
    )

    expect(counts).toEqual({ notified: 1, notifyFailed: 0, erased: 1 })
    expect(mailer.sent.map((mail) => mail.to)).toEqual(['due@example.com'])
    expect(set).toHaveBeenCalledWith(now)
    expect(files.deleteFiles).toHaveBeenCalledWith({ prefix: 'users/stale/' })
    expect(update).toHaveBeenCalledWith({ stale: null })
    expect(auth.deleteUsers).toHaveBeenCalledWith(['stale'])
  })

  it('erases nobody when every account is recent', async () => {
    const auth = {
      listUsers: listing([SIGNED_IN]),
      deleteUsers: vi.fn(),
    }

    expect(
      await runRetention(
        {
          db: {} as never,
          files: {} as never,
          auth: auth as never,
          mailer: null,
        },
        now,
      ),
    ).toEqual({ notified: 0, notifyFailed: 0, erased: 0 })
    expect(auth.deleteUsers).not.toHaveBeenCalled()
  })

  it('erases without warning anyone when the site cannot send mail', async () => {
    const auth = {
      listUsers: listing([DUE]),
      deleteUsers: vi.fn(),
    }

    expect(
      await runRetention(
        {
          db: {} as never,
          files: {} as never,
          auth: auth as never,
          mailer: null,
        },
        now,
      ),
    ).toEqual({ notified: 0, notifyFailed: 0, erased: 0 })
  })
})
