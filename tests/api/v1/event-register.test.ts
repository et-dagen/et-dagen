/**
 * Pins what registering for an event and opting out do today, including behaviour that may be a
 * bug. A change here is a change to the v1 contract and needs a reason.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '../support/api'
import { createUser, read, resetEmulators, seed } from '../support/emulators'

const OPEN = { start: '2000-01-01T00:00', end: '2999-12-31T23:59' }
const CLOSED = { start: '2000-01-01T00:00', end: '2000-01-02T00:00' }

const student = { userType: 'student', studyProgram: 'MTEL', currentYear: 3 }
const admin = { userType: 'admin' }

const event = (extra: Record<string, unknown> = {}) => ({
  title: 'Workshop',
  companyUID: 'company',
  date: { start: '2999-01-01T18:00' },
  capacity: 2,
  registration: OPEN,
  ...extra,
})

const register = (body: unknown, token?: string) =>
  api('/api/v1/event/register', { method: 'POST', body, token })

const optOut = (body: unknown, token?: string) =>
  api('/api/v1/event/register', { method: 'DELETE', body, token })

/** The status and v1 status message of an error response */
const rejected = (status: number, statusMessage: string) => ({
  status,
  body: expect.objectContaining({ statusCode: status, statusMessage }),
})

beforeEach(resetEmulators)

describe('POST /api/v1/event/register', () => {
  it('rejects a request without a token', async () => {
    expect(await register({ eventUID: 'workshop' })).toEqual(
      rejected(401, 'Error (firebase/auth/user-not-found).'),
    )
  })

  it('treats a signed-in account without a user record as signed out', async () => {
    const { token } = await createUser()

    expect(await register({ eventUID: 'workshop' }, token)).toEqual(
      rejected(401, 'Error (firebase/auth/user-not-found).'),
    )
  })

  it('needs an event uid', async () => {
    const { token } = await createUser(student)

    expect(await register({}, token)).toEqual(
      rejected(400, 'Error (event/missing-event-id).'),
    )
  })

  it('answers 404 for an unknown event', async () => {
    const { token } = await createUser(student)

    expect(await register({ eventUID: 'missing' }, token)).toEqual(
      rejected(404, 'Error (event/not-found).'),
    )
  })

  it('answers 404 when the event has no capacity', async () => {
    const { token } = await createUser(student)
    await seed('events/workshop', event({ capacity: 0 }))

    expect(await register({ eventUID: 'workshop' }, token)).toEqual(
      rejected(404, 'Error (event/register/registration-unnecessary).'),
    )
  })

  it('answers 404 outside the registration window', async () => {
    const { token } = await createUser(student)
    await seed('events/workshop', event({ registration: CLOSED }))

    expect(await register({ eventUID: 'workshop' }, token)).toEqual(
      rejected(404, 'Error (event/register/registration-closed).'),
    )
  })

  it('lets an admin register outside the registration window', async () => {
    const { uid, token } = await createUser(admin)
    await seed('events/workshop', event({ registration: CLOSED }))

    expect(await register({ eventUID: 'workshop' }, token)).toEqual({
      status: 201,
      body: undefined,
    })
    expect(await read(`events/workshop/attendants/${uid}`)).toMatchObject({
      attended: false,
    })
  })

  it('answers 404 with a malformed message when requirements are not met', async () => {
    const { token } = await createUser(student)
    await seed(
      'events/workshop',
      event({ registration: { ...OPEN, requirements: { years: [1, 2] } } }),
    )

    expect(await register({ eventUID: 'workshop' }, token)).toEqual(
      rejected(404, 'Events: Error (register/requirements-not-met).'),
    )
  })

  it('registers the user while there is room', async () => {
    const { uid, token } = await createUser(student)
    await seed(
      'events/workshop',
      event({ registration: { ...OPEN, requirements: { years: [3] } } }),
    )

    expect(await register({ eventUID: 'workshop' }, token)).toEqual({
      status: 201,
      body: undefined,
    })
    expect(await read(`events/workshop/attendants/${uid}`)).toEqual({
      attended: false,
      registeredAt: expect.any(Number),
    })
  })

  it('answers 404 when the user is already registered', async () => {
    const { uid, token } = await createUser(student)
    await seed(
      'events/workshop',
      event({ attendants: { [uid]: { attended: false, registeredAt: 1 } } }),
    )

    expect(await register({ eventUID: 'workshop' }, token)).toEqual(
      rejected(404, 'Error (event/register/already-registered).'),
    )
  })

  it('queues the user when the event is full, and only once', async () => {
    const { uid, token } = await createUser(student)
    await seed(
      'events/workshop',
      event({ capacity: 1, attendants: { other: { attended: false } } }),
    )

    expect(await register({ eventUID: 'workshop' }, token)).toEqual({
      status: 201,
      body: undefined,
    })
    expect(Object.values((await read('events/workshop/queue')) ?? {})).toEqual([
      uid,
    ])

    expect(await register({ eventUID: 'workshop' }, token)).toEqual(
      rejected(404, 'Error (event/register/already-queued).'),
    )
  })

  it('admits exactly the capacity when many register at once', async () => {
    const students = await Promise.all(
      Array.from({ length: 8 }, () => createUser(student)),
    )
    await seed('events/workshop', event({ capacity: 3 }))

    const answers = await Promise.all(
      students.map(({ token }) => register({ eventUID: 'workshop' }, token)),
    )

    expect(answers.every(({ status }) => status === 201)).toBe(true)
    const attendants = (await read('events/workshop/attendants')) as object
    const queue = Object.values((await read('events/workshop/queue')) as object)
    expect(Object.keys(attendants)).toHaveLength(3)
    expect(queue).toHaveLength(5)
    expect(new Set([...Object.keys(attendants), ...queue])).toEqual(
      new Set(students.map(({ uid }) => uid)),
    )
  })

  it('refuses a company user', async () => {
    const { token } = await createUser({ userType: 'company' })
    await seed('events/workshop', event())

    expect(await register({ eventUID: 'workshop' }, token)).toEqual({
      status: 403,
      body: expect.objectContaining({
        statusCode: 403,
        code: 'event/register/forbidden',
      }),
    })
  })

  it('lets only an admin register someone else', async () => {
    const { token } = await createUser(student)
    const other = await createUser(student)
    await seed('events/workshop', event())

    expect(
      await register({ eventUID: 'workshop', userUID: other.uid }, token),
    ).toEqual(rejected(401, 'Error (event/register/non-admin-user).'))

    const { token: adminToken } = await createUser(admin)
    expect(
      await register({ eventUID: 'workshop', userUID: other.uid }, adminToken),
    ).toEqual({ status: 201, body: undefined })
    expect(await read(`events/workshop/attendants/${other.uid}`)).toMatchObject(
      {
        attended: false,
      },
    )
  })
})

describe('DELETE /api/v1/event/register', () => {
  it('removes the attendant and moves the first in the queue up', async () => {
    const { uid, token } = await createUser(student)
    await seed(
      'events/workshop',
      event({
        capacity: 1,
        attendants: { [uid]: { attended: false, registeredAt: 1 } },
        queue: { 1700000000002: 'second', 1700000000001: 'first' },
      }),
    )

    expect(await optOut({ eventUID: 'workshop' }, token)).toEqual({
      status: 201,
      body: undefined,
    })
    expect(await read('events/workshop/attendants')).toEqual({
      first: { attended: false, registeredAt: expect.any(Number) },
    })
    expect(await read('events/workshop/queue')).toEqual({
      1700000000002: 'second',
    })
  })

  it('takes a queued user out of the queue', async () => {
    const { uid, token } = await createUser(student)
    await seed(
      'events/workshop',
      event({ capacity: 1, queue: { 1700000000001: uid } }),
    )

    expect(await optOut({ eventUID: 'workshop' }, token)).toEqual({
      status: 201,
      body: undefined,
    })
    expect(await read('events/workshop/queue')).toBeNull()
  })

  it('answers 404 when the user is neither registered nor queued', async () => {
    const { token } = await createUser(student)
    await seed('events/workshop', event())

    expect(await optOut({ eventUID: 'workshop' }, token)).toEqual(
      rejected(404, 'Error (event/register/user-not-registered-or-queued).'),
    )
  })

  it('answers 404 outside the registration window', async () => {
    const { uid, token } = await createUser(student)
    await seed(
      'events/workshop',
      event({
        registration: CLOSED,
        attendants: { [uid]: { attended: false, registeredAt: 1 } },
      }),
    )

    expect(await optOut({ eventUID: 'workshop' }, token)).toEqual(
      rejected(404, 'Error (event/register/registration-closed).'),
    )
  })
})
