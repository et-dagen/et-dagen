/**
 * Setting roles and memberships, and what a new account starts with (#640)
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
const subjectFor = async (token: string) =>
  (await api('/api/v1/user/subject', { token })).body as {
    roles: string[]
    companies: Record<string, string[]>
  }

beforeEach(async () => {
  await resetEmulators()
  await seed('companies', {
    acme: { name: 'Acme', type: 'partner', cvAccess: false },
    globex: { name: 'Globex', type: 'main-partner', cvAccess: true },
  })
})

describe('PUT /api/v1/user/access', () => {
  const coordinatorOf = (uid: string) => ({
    uid,
    roles: ['user', 'coordinator'],
    memberships: [
      { companyUID: 'acme', kind: 'coordinator' },
      { companyUID: 'globex', kind: 'coordinator' },
    ],
  })

  it('lets an admin make a student a coordinator of two companies', async () => {
    const admin = await createUser({ userType: 'admin' })
    const volunteer = await createUser(student)

    const response = await api('/api/v1/user/access', {
      method: 'PUT',
      body: coordinatorOf(volunteer.uid),
      token: admin.token,
    })

    expect(response.status).toBe(204)
    const subject = await subjectFor(volunteer.token)
    // a coordinator already has what a student has, so `user` is not stored beside it
    expect(subject.roles).toEqual(['coordinator'])
    expect(Object.keys(subject.companies).sort()).toEqual(['acme', 'globex'])
  })

  it('leaves it to admins', async () => {
    const volunteer = await createUser(student)

    const response = await api('/api/v1/user/access', {
      method: 'PUT',
      body: coordinatorOf(volunteer.uid),
      token: volunteer.token,
    })

    expect(response.status).toBe(403)
    expect(response.body).toMatchObject({ code: 'auth/forbidden' })
    expect(await read(`roles/${volunteer.uid}`)).toBeNull()
  })

  it('refuses a membership without its role, and an unknown company', async () => {
    const admin = await createUser({ userType: 'admin' })
    const volunteer = await createUser(student)

    for (const [memberships, code] of [
      [
        [{ companyUID: 'acme', kind: 'employee' }],
        'user/membership-without-role',
      ],
      [[{ companyUID: 'initech', kind: 'coordinator' }], 'company/not-found'],
    ] as const) {
      const response = await api('/api/v1/user/access', {
        method: 'PUT',
        body: { ...coordinatorOf(volunteer.uid), memberships },
        token: admin.token,
      })
      expect(response.body).toMatchObject({ code })
    }
    expect(await read(`roles/${volunteer.uid}`)).toBeNull()
  })
})

describe('GET /api/v1/user/access', () => {
  it('shows an admin the access a user has, or will have after the migration', async () => {
    const admin = await createUser({ userType: 'admin' })
    const rep = await createUser({ userType: 'company', companyUID: 'acme' })

    const response = await api(`/api/v1/user/access?uid=${rep.uid}`, {
      token: admin.token,
    })

    expect(response.body).toEqual({
      roles: ['coordinator'],
      memberships: [{ companyUID: 'acme', kind: 'coordinator' }],
    })
  })

  it('lists stored access with each user for admins', async () => {
    const admin = await createUser({ userType: 'admin' })
    const volunteer = await createUser(student)
    await api('/api/v1/user/access', {
      method: 'PUT',
      body: {
        uid: volunteer.uid,
        roles: ['user', 'coordinator'],
        memberships: [{ companyUID: 'acme', kind: 'coordinator' }],
      },
      token: admin.token,
    })

    const listed = (await api('/api/v1/user?scope=all', { token: admin.token }))
      .body as { uid: string; access?: unknown }[]

    expect(listed.find((u) => u.uid === volunteer.uid)?.access).toEqual({
      roles: ['coordinator'],
      memberships: [{ companyUID: 'acme', kind: 'coordinator' }],
    })
    expect(listed.find((u) => u.uid === admin.uid)).not.toHaveProperty('access')
  })

  it('leaves it to admins', async () => {
    const rep = await createUser({ userType: 'company', companyUID: 'acme' })

    const response = await api(`/api/v1/user/access?uid=${rep.uid}`, {
      token: rep.token,
    })

    expect(response.status).toBe(403)
  })
})

describe('signing up', () => {
  it('makes a new account a student', async () => {
    const { uid, token } = await createUser()

    await api('/api/v1/user', {
      method: 'POST',
      body: { studyProgram: 'MTEL', currentYear: 3 },
      token,
    })

    expect(Object.keys((await read(`roles/${uid}`)) as object)).toEqual([
      'user',
    ])
    expect(await read(`memberships/${uid}`)).toBeNull()
  })

  it("makes an account with a registration code a contact for the code's company", async () => {
    await seed('registrationCodes', {
      k1: { code: 'acme-abcdefgh', companyUID: 'acme' },
    })
    const { uid, token } = await createUser()

    await api('/api/v1/user?code=acme-abcdefgh', {
      method: 'POST',
      body: {},
      token,
    })

    expect(Object.keys((await read(`roles/${uid}`)) as object)).toEqual([
      'company',
    ])
    expect(await read(`memberships/${uid}/acme/kind`)).toBe('employee')
    expect((await subjectFor(token)).companies).toHaveProperty('acme')
  })

  it("leaves an existing account's roles alone when it changes its profile", async () => {
    const { uid, token } = await createUser({
      userType: 'company',
      companyUID: 'acme',
    })

    await api('/api/v1/user', {
      method: 'POST',
      body: { dietaryRestrictions: ['vegan'] },
      token,
    })

    await expect.poll(() => read(`users/${uid}/updated`)).toBeTruthy()
    expect(await read(`roles/${uid}`)).toBeNull()
  })
})
