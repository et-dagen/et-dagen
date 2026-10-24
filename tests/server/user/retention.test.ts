import { describe, expect, it, vi } from 'vitest'
import { Instant } from '@/domain/time'
import {
  eraseInactiveUsers,
  inactiveUids,
  lastActive,
} from '@/server/user/retention'

const now = Instant.parse('2026-10-24T03:00:00.000Z')

/** An account as Firebase Auth lists it, with only the fields retention reads */
const account = (
  uid: string,
  metadata: {
    creationTime: string
    lastSignInTime?: string
    lastRefreshTime?: string | null
  },
) => ({ uid, metadata })

const STALE = account('stale', {
  creationTime: 'Mon, 01 Jun 2020 10:00:00 GMT',
  lastSignInTime: 'Fri, 01 Oct 2021 10:00:00 GMT',
})
const SIGNED_IN = account('signed-in', {
  creationTime: 'Mon, 01 Jun 2020 10:00:00 GMT',
  lastSignInTime: 'Sun, 01 Jun 2025 10:00:00 GMT',
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

describe('inactiveUids', () => {
  it('reads every page and returns only the accounts past the limit', async () => {
    const listUsers = listing([SIGNED_IN, STALE, STAYED_SIGNED_IN])

    expect(await inactiveUids({ listUsers } as never, now)).toEqual(['stale'])
    expect(listUsers).toHaveBeenCalledTimes(2)
  })
})

describe('eraseInactiveUsers', () => {
  it('erases the inactive users and reports how many', async () => {
    const auth = {
      listUsers: listing([STALE, SIGNED_IN]),
      deleteUsers: vi.fn(() => Promise.resolve()),
    }
    const update = vi.fn(() => Promise.resolve())
    const db = {
      ref: () => ({ once: () => Promise.resolve({ val: () => null }), update }),
    }
    const files = { deleteFiles: vi.fn(() => Promise.resolve()) }

    const erased = await eraseInactiveUsers(
      { db: db as never, files, auth: auth as never },
      now,
    )

    expect(erased).toBe(1)
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
      await eraseInactiveUsers(
        { db: {} as never, files: {} as never, auth: auth as never },
        now,
      ),
    ).toBe(0)
    expect(auth.deleteUsers).not.toHaveBeenCalled()
  })
})
