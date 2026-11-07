/**
 * Admins edit the study programmes and the fair's dates; students on a renamed programme follow it
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '@/tests/api/support/api'
import {
  createUser,
  read,
  resetEmulators,
  seed,
} from '@/tests/api/support/emulators'

beforeEach(resetEmulators)

describe('study programmes', () => {
  it('adds, renames, closes and deletes a programme by code', async () => {
    const admin = await createUser({ userType: 'admin' })
    await createUser({
      userType: 'student',
      studyProgram: 'MTEL',
      currentYear: 3,
    })
    await seed('studyProgrammes', {
      MTEL: { name: 'Elektronikk', type: 'integrated' },
    })

    const added = await api('/api/v1/programme', {
      method: 'POST',
      body: { code: 'belektronikk', name: 'Elektronikk', degree: 'bachelor' },
      token: admin.token,
    })
    expect(added).toMatchObject({
      status: 201,
      body: { code: 'BELEKTRONIKK', name: 'Elektronikk', open: true },
    })

    expect(
      await api('/api/v1/programme/MTEL', {
        method: 'PUT',
        body: {
          name: 'Elektronisk systemdesign',
          degree: 'integrated',
          open: false,
        },
        token: admin.token,
      }),
    ).toMatchObject({ status: 200, body: { code: 'MTEL', open: false } })
    expect(await read('studyProgrammes/MTEL')).toEqual({
      name: 'Elektronisk systemdesign',
      type: 'integrated',
      closed: true,
    })

    expect(
      await api('/api/v1/programme/BELEKTRONIKK', {
        method: 'DELETE',
        token: admin.token,
      }),
    ).toMatchObject({ status: 204 })
    expect(
      await api('/api/v1/programme/MTEL', {
        method: 'DELETE',
        token: admin.token,
      }),
    ).toMatchObject({ status: 409, body: { code: 'programme/in-use' } })
  })

  it('refuses a code that is taken', async () => {
    const admin = await createUser({ userType: 'admin' })
    await seed('studyProgrammes', {
      MTEL: { name: 'Elektronikk', type: 'integrated' },
    })

    expect(
      await api('/api/v1/programme', {
        method: 'POST',
        body: { code: 'mtel', name: 'Noe annet', degree: 'master' },
        token: admin.token,
      }),
    ).toMatchObject({ status: 409, body: { code: 'programme/code-taken' } })
  })
})

describe("the fair's dates", () => {
  it('sets the dates the landing page reads', async () => {
    const admin = await createUser({ userType: 'admin' })

    expect(
      await api('/api/v1/generalInfo', {
        method: 'PUT',
        body: { start: '2027-02-09T11:00', end: '2027-02-10T10:00' },
        token: admin.token,
      }),
    ).toMatchObject({ status: 200 })
    expect((await api('/api/v1/generalInfo')).body).toEqual({
      date: { start: '2027-02-09T11:00:00', end: '2027-02-10T10:00:00' },
    })
  })

  it('refuses an end before the start', async () => {
    const admin = await createUser({ userType: 'admin' })
    expect(
      await api('/api/v1/generalInfo', {
        method: 'PUT',
        body: { start: '2027-02-10T10:00', end: '2027-02-09T11:00' },
        token: admin.token,
      }),
    ).toMatchObject({ status: 400, body: { code: 'fair/invalid-dates' } })
  })
})
