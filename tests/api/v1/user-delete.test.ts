/**
 * Deleting an account from "My profile", and an admin deleting someone else's
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { API_PORT } from '@/tests/api/support/api'
import {
  accountExists,
  createUser,
  read,
  resetEmulators,
  seed,
} from '@/tests/api/support/emulators'

const student = { userType: 'student', studyProgram: 'MTEL', currentYear: 3 }
const admin = { userType: 'admin' }

/** DELETE /api/v1/user, keeping the response headers to inspect cookies */
const deleteUsers = (body: unknown, token: string) =>
  fetch(`http://127.0.0.1:${API_PORT}/api/v1/user`, {
    method: 'DELETE',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

/** The last session cookie the response sets, as the browser would keep it */
const tokenCookie = (response: Response) =>
  response.headers
    .getSetCookie()
    .filter((cookie) => cookie.startsWith('__session='))
    .at(-1)

beforeEach(resetEmulators)

describe('DELETE /api/v1/user', () => {
  it('deletes the caller and clears their session cookie', async () => {
    const { uid, token } = await createUser(student)

    const response = await deleteUsers({}, token)

    expect(response.status).toBe(204)
    expect(await read(`users/${uid}`)).toBeNull()
    expect(await accountExists(uid)).toBe(false)
    expect(tokenCookie(response)).toMatch(/^__session=;.*Max-Age=0/i)
  })

  it('frees their event place for the first in the queue', async () => {
    const { uid, token } = await createUser(student)
    const other = await createUser(student)
    // a whole record, as v1 stores it: one the domain cannot read promotes nobody
    await seed('events/workshop', {
      title: 'Workshop',
      companyUID: 'company',
      capacity: 1,
      date: { start: '2999-01-01T18:00', end: '2999-01-01T20:00' },
      registration: { start: '2000-01-01T00:00', end: '2998-12-31T23:59' },
      attendants: { [uid]: { attended: false, registeredAt: 1 } },
      queue: { 1700000000000: other.uid },
    })

    await deleteUsers({}, token)

    const event = (await read('events/workshop')) as {
      attendants: Record<string, unknown>
      queue?: unknown
    }
    expect(Object.keys(event.attendants)).toEqual([other.uid])
    expect(event.queue).toBeUndefined()
  })

  it('ignores other uids from a non-admin and deletes only the caller', async () => {
    const other = await createUser(student)
    const { uid, token } = await createUser(student)

    await deleteUsers({ UIDs: [other.uid] }, token)

    expect(await read(`users/${other.uid}`)).toEqual(student)
    expect(await accountExists(other.uid)).toBe(true)
    expect(await accountExists(uid)).toBe(false)
  })

  it("lets an admin delete someone else and keeps the admin's cookie", async () => {
    const other = await createUser(student)
    const { uid, token } = await createUser(admin)

    const response = await deleteUsers({ UIDs: [other.uid] }, token)

    expect(response.status).toBe(204)
    expect(await accountExists(other.uid)).toBe(false)
    expect(await read(`users/${uid}`)).toEqual(admin)
    // the admin's own session is left alone: nothing clears it
    expect(tokenCookie(response)).toBeUndefined()
  })
})
