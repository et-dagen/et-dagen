/**
 * The caller's own sign-ups, for Min side
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '@/tests/api/support/api'
import { createUser, resetEmulators, seed } from '@/tests/api/support/emulators'

const student = { userType: 'basic', studyProgram: 'MTEL', currentYear: 3 }

beforeEach(async () => {
  await resetEmulators()
})

describe('GET /api/v1/user/events', () => {
  it('lists where the caller stands on each event, and nobody else', async () => {
    const ada = await createUser(student)
    const bo = await createUser(student)
    await seed('events', {
      talk: {
        title: 'Talk',
        companyUID: 'acme',
        date: { start: '2027-02-09T17:15', end: '2027-02-09T19:00' },
        attendants: { [ada.uid]: { attended: false, registeredAt: 1 } },
      },
      dinner: {
        title: 'Dinner',
        companyUID: 'acme',
        date: { start: '2027-02-10T18:00', end: '2027-02-10T21:00' },
        attendants: { [bo.uid]: { attended: false, registeredAt: 1 } },
        queue: { k1: bo.uid, k2: ada.uid },
      },
    })

    const response = await api('/api/v1/user/events', { token: ada.token })

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject([
      { eventUID: 'talk', status: 'attending', attended: false },
      { eventUID: 'dinner', status: 'queued', position: 2 },
    ])
  })

  it('needs a signed-in caller', async () => {
    expect((await api('/api/v1/user/events')).status).toBe(401)
  })
})
