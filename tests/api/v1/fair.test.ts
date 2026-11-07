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
  it('adds, renames, closes and deletes a programme', async () => {
    const admin = await createUser({ userType: 'admin' })
    const student = await createUser({
      userType: 'student',
      studyProgram: 'MTEL',
      currentYear: 3,
    })
    await seed('studyProgrammes', { 0: { name: 'MTEL', type: 'integrated' } })

    const added = await api('/api/v1/programme', {
      method: 'POST',
      body: { name: 'Kybernetikk', degree: 'master' },
      token: admin.token,
    })
    expect(added).toMatchObject({
      status: 201,
      body: { name: 'Kybernetikk', degree: 'master', open: true },
    })

    const renamed = await api('/api/v1/programme/0', {
      method: 'PUT',
      body: { name: 'Elektronikk', degree: 'integrated', open: false },
      token: admin.token,
    })
    expect(renamed).toMatchObject({ status: 200, body: { moved: 1 } })
    expect(await read(`users/${student.uid}/studyProgram`)).toBe('Elektronikk')
    expect(await read('studyProgrammes/0')).toEqual({
      name: 'Elektronikk',
      type: 'integrated',
      closed: true,
    })

    const id = (added.body as { id: string }).id
    expect(
      await api(`/api/v1/programme/${id}`, {
        method: 'DELETE',
        token: admin.token,
      }),
    ).toMatchObject({ status: 204 })
    expect(
      await api('/api/v1/programme/0', {
        method: 'DELETE',
        token: admin.token,
      }),
    ).toMatchObject({ status: 409, body: { code: 'programme/in-use' } })
  })

  it('refuses a name that is taken', async () => {
    const admin = await createUser({ userType: 'admin' })
    await seed('studyProgrammes', { 0: { name: 'MTEL', type: 'integrated' } })

    expect(
      await api('/api/v1/programme', {
        method: 'POST',
        body: { name: 'mtel', degree: 'master' },
        token: admin.token,
      }),
    ).toMatchObject({ status: 409, body: { code: 'programme/name-taken' } })
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
