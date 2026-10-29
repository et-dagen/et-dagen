/**
 * Who may create, change and remove events, and see or mark who attended
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '@/tests/api/support/api'
import {
  createUser,
  read,
  resetEmulators,
  seed,
} from '@/tests/api/support/emulators'

const fields = (companyUID: string) => ({
  companyUID,
  capacity: 10,
  date: { start: '2999-02-01T10:00', end: '2999-02-01T12:00' },
  description: 'A talk',
  location: { name: 'Room', map: null },
  title: 'Talk',
  registration: { start: '2999-01-01T10:00', end: '2999-01-02T10:00' },
})
const contactFor = (companyUID: string) =>
  createUser({ userType: 'company', companyUID })
const admin = () => createUser({ userType: 'admin' })
const student = () =>
  createUser({ userType: 'student', studyProgram: 'MTEL', currentYear: 3 })
// a student who volunteers for E&T-dagene with a company
const coordinatorFor = async (companyUID: string) => {
  const user = await student()
  const given = { createdBy: 'test' }
  await seed(`roles/${user.uid}`, { coordinator: given })
  await seed(`memberships/${user.uid}/${companyUID}`, {
    kind: 'coordinator',
    ...given,
  })
  return user
}

beforeEach(async () => {
  await resetEmulators()
  await seed('companies', {
    acme: { name: 'Acme', type: 'partner' },
    globex: { name: 'Globex', type: 'partner' },
    initech: { name: 'Initech', type: 'sponsor' },
  })
  await seed('events', {
    talk: { ...fields('acme'), attendants: {} },
    dinner: { ...fields('globex'), attendants: {} },
  })
})

describe('POST /api/v1/event', () => {
  const create = (companyUID: string, token?: string) =>
    api('/api/v1/event', { method: 'POST', body: fields(companyUID), token })

  it("creates an event for a coordinator's company, whatever its tier", async () => {
    expect(
      (await create('acme', (await coordinatorFor('acme')).token)).status,
    ).toBe(201)
    expect(
      (await create('initech', (await coordinatorFor('initech')).token)).status,
    ).toBe(201)
  })

  it("refuses a company's own contact, another company and a student", async () => {
    const refusals = [
      await create('acme', (await contactFor('acme')).token),
      await create('globex', (await coordinatorFor('acme')).token),
      await create('acme', (await student()).token),
    ]

    for (const response of refusals) {
      expect(response.status).toBe(403)
      expect(response.body).toMatchObject({ code: 'auth/forbidden' })
    }
  })

  it('answers 401 when signed out', async () => {
    const response = await create('acme')

    expect(response.status).toBe(401)
    expect(response.body).toMatchObject({ code: 'auth/signed-out' })
  })
})

describe('PUT and DELETE /api/v1/event', () => {
  const update = (eventUID: string, companyUID: string, token: string) =>
    api('/api/v1/event', {
      method: 'PUT',
      body: { ...fields(companyUID), eventUID, title: 'Changed' },
      token,
    })
  const remove = (eventUID: string, companyUID: string, token: string) =>
    api('/api/v1/event', {
      method: 'DELETE',
      body: { eventUID, companyUID },
      token,
    })

  it("changes and removes a coordinator's company's event", async () => {
    const { token } = await coordinatorFor('acme')

    expect((await update('talk', 'acme', token)).status).toBe(204)
    expect(await read('events/talk/title')).toBe('Changed')
    expect((await remove('talk', 'acme', token)).status).toBe(204)
  })

  it("leaves a company's events to E&T-dagene", async () => {
    const { token } = await contactFor('acme')

    for (const response of [
      await update('talk', 'acme', token),
      await remove('talk', 'acme', token),
    ]) {
      expect(response.status).toBe(403)
    }
    expect(await read('events/talk/title')).toBe('Talk')
  })

  it('goes by the stored owner, not the company the body names', async () => {
    const { token } = await coordinatorFor('acme')

    for (const response of [
      await update('dinner', 'acme', token),
      await remove('dinner', 'acme', token),
    ]) {
      expect(response.status).toBe(403)
      expect(response.body).toMatchObject({ code: 'auth/forbidden' })
    }
    expect(await read('events/dinner/title')).toBe('Talk')
  })

  it('answers 404 to a coordinator for an event that does not exist', async () => {
    const { token } = await coordinatorFor('acme')

    expect((await update('missing', 'acme', token)).status).toBe(404)
    expect(await read('events/missing')).toBeNull()
  })

  it('lets an admin change any event', async () => {
    const { token } = await admin()

    expect((await update('dinner', 'globex', token)).status).toBe(204)
  })
})

describe('attendants and attendance', () => {
  const attendants = (token?: string) =>
    api('/api/v1/event/attendants?eventUID=talk', { token })
  const mark = (userUID: string, token: string) =>
    api('/api/v1/event/attended', {
      method: 'PATCH',
      body: { eventUID: 'talk', userUID, attended: true },
      token,
    })

  it('refuses company contacts and lets admins see and mark them', async () => {
    const attendant = await student()
    await seed(`events/talk/attendants/${attendant.uid}`, {
      attended: false,
      registeredAt: 1,
    })
    const contact = await contactFor('acme')
    const { token } = await admin()

    expect((await attendants(contact.token)).status).toBe(403)
    expect((await mark(attendant.uid, contact.token)).status).toBe(403)
    expect((await attendants()).status).toBe(401)

    expect((await attendants(token)).status).toBe(200)
    expect((await mark(attendant.uid, token)).status).toBe(204)
    expect(await read(`events/talk/attendants/${attendant.uid}/attended`)).toBe(
      true,
    )
  })
  it("lets a coordinator scan attendance at their companies' events only", async () => {
    const attendant = await student()
    for (const event of ['talk', 'dinner']) {
      await seed(`events/${event}/attendants/${attendant.uid}`, {
        attended: false,
        registeredAt: 1,
      })
    }
    const coordinator = await student()
    const given = { createdBy: 'test' }
    await seed(`roles/${coordinator.uid}`, { coordinator: given })
    await seed(`memberships/${coordinator.uid}/acme`, { kind: 'coordinator' })

    expect((await attendants(coordinator.token)).status).toBe(200)
    expect((await mark(attendant.uid, coordinator.token)).status).toBe(204)
    expect(await read(`events/talk/attendants/${attendant.uid}/attended`)).toBe(
      true,
    )

    const other = await api('/api/v1/event/attended', {
      method: 'PATCH',
      body: { eventUID: 'dinner', userUID: attendant.uid, attended: true },
      token: coordinator.token,
    })
    expect(other.status).toBe(403)
  })
  it("lets any coordinator scan attendance at E&T-dagene's own events", async () => {
    const attendant = await student()
    await seed('events/fair', {
      ...fields('etdagene'),
      attendants: { [attendant.uid]: { attended: false, registeredAt: 1 } },
    })
    const coordinator = await student()
    const given = { createdBy: 'test' }
    await seed(`roles/${coordinator.uid}`, { coordinator: given })
    const bystander = await student()

    const markAt = (token: string) =>
      api('/api/v1/event/attended', {
        method: 'PATCH',
        body: { eventUID: 'fair', userUID: attendant.uid, attended: true },
        token,
      })

    expect((await markAt(bystander.token)).status).toBe(403)
    expect((await markAt(coordinator.token)).status).toBe(204)
    expect(await read(`events/fair/attendants/${attendant.uid}/attended`)).toBe(
      true,
    )
  })
  it("lets a coordinator sign up for another company's event but not their own", async () => {
    const open = {
      start: '2000-01-01T10:00',
      end: '2999-01-01T10:00',
    }
    await seed('events/talk/registration', open)
    await seed('events/dinner/registration', open)
    const coordinator = await student()
    const given = { createdBy: 'test' }
    await seed(`roles/${coordinator.uid}`, { coordinator: given })
    await seed(`memberships/${coordinator.uid}/acme`, { kind: 'coordinator' })

    const signUp = (eventUID: string) =>
      api('/api/v1/event/register', {
        method: 'POST',
        body: { eventUID },
        token: coordinator.token,
      })

    expect((await signUp('dinner')).status).toBe(201)
    const own = await signUp('talk')
    expect(own.status).toBe(403)
    expect(own.body).toMatchObject({ code: 'event/register/forbidden' })
  })
})
