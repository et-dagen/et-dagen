/**
 * Who may list, change and assign users, and manage registration codes
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '@/tests/api/support/api'
import {
  createUser,
  read,
  resetEmulators,
  seed,
} from '@/tests/api/support/emulators'

const student = { userType: 'basic', studyProgram: 'MTEL', currentYear: 3 }
const contactFor = (companyUID: string) =>
  createUser({ userType: 'company', companyUID })

beforeEach(async () => {
  await resetEmulators()
  await seed('companies', {
    acme: { name: 'Acme', type: 'partner', cvAccess: false },
    initech: { name: 'Initech', type: 'sponsor', cvAccess: false },
  })
})

describe('GET /api/v1/user?scope=all', () => {
  const list = async (token: string) =>
    (
      (await api('/api/v1/user?scope=all', { token })).body as {
        uid: string
      }[]
    )
      .map((user) => user.uid)
      .sort()

  it("shows a company the people on the events it manages, and a sponsor's none", async () => {
    const attendant = await createUser(student)
    const bystander = await createUser(student)
    await seed('events', {
      talk: {
        companyUID: 'acme',
        attendants: { [attendant.uid]: { attended: false } },
      },
      fair: {
        companyUID: 'initech',
        attendants: { [bystander.uid]: { attended: false } },
      },
    })

    expect(await list((await contactFor('acme')).token)).toEqual([
      attendant.uid,
    ])
    expect(await list((await contactFor('initech')).token)).toEqual([])
  })

  it('shows an admin everyone', async () => {
    const one = await createUser(student)
    const admin = await createUser({ userType: 'admin' })

    expect(await list(admin.token)).toEqual([one.uid, admin.uid].sort())
  })
})

describe('changing users', () => {
  it("refuses changing another user's account", async () => {
    const owner = await createUser(student)
    const other = await createUser(student)

    const response = await api('/api/v1/user', {
      method: 'PUT',
      body: { uid: owner.uid, name: 'Taken' },
      token: other.token,
    })

    expect(response.status).toBe(403)
    expect(response.body).toMatchObject({ code: 'auth/forbidden' })
  })

  it('keeps a student from making themselves an admin', async () => {
    const { uid, token } = await createUser(student)

    await api('/api/v1/user', {
      method: 'POST',
      body: { uid, ...student, userType: 'admin', companyUID: 'acme' },
      token,
    })

    // the profile no longer says who the user is, and the roles are untouched
    await expect.poll(() => read(`users/${uid}/updated`)).toBeTruthy()
    expect(await read(`users/${uid}/userType`)).toBeNull()
    expect(await read(`users/${uid}/companyUID`)).toBeNull()
    expect(Object.keys((await read(`roles/${uid}`)) as object)).toEqual([
      'user',
    ])
  })
})

describe('registration codes and images', () => {
  it('leaves them to admins', async () => {
    const { token } = await contactFor('acme')

    for (const response of [
      await api('/api/v1/code', { token }),
      await api('/api/v1/code?companyUID=acme', { method: 'POST', token }),
      await api('/api/v1/image', { method: 'POST', token }),
    ]) {
      expect(response.status).toBe(403)
      expect(response.body).toMatchObject({ code: 'auth/forbidden' })
    }
    expect((await api('/api/v1/code')).status).toBe(401)
  })
})
