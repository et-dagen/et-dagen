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

  it('withholds an entitlement from one employee, while their colleague keeps it', async () => {
    const admin = await createUser({ userType: 'admin' })
    const [one, colleague] = [
      await createUser({ userType: 'company', companyUID: 'globex' }),
      await createUser({ userType: 'company', companyUID: 'globex' }),
    ]
    const resumes = (token: string) =>
      api('/api/v1/user?scope=all', { token }).then((r) =>
        (r.body as { resume?: string }[]).some((u) => 'resume' in u),
      )
    await createUser({ ...student, resume: 'resumes/someone.pdf' })

    const response = await api('/api/v1/user/access', {
      method: 'PUT',
      body: {
        uid: one.uid,
        roles: ['company'],
        memberships: [
          {
            companyUID: 'globex',
            kind: 'employee',
            withheld: ['ent:resume:view'],
          },
        ],
      },
      token: admin.token,
    })

    expect(response.status).toBe(204)
    expect((await subjectFor(one.token)).companies.globex).not.toContain(
      'ent:resume:view',
    )
    expect((await subjectFor(colleague.token)).companies.globex).toContain(
      'ent:resume:view',
    )
    expect(await resumes(one.token)).toBe(false)
    expect(await resumes(colleague.token)).toBe(true)

    const shown = await api(`/api/v1/user/access?uid=${one.uid}`, {
      token: admin.token,
    })
    expect(shown.body).toMatchObject({
      memberships: [
        {
          companyUID: 'globex',
          kind: 'employee',
          withheld: ['ent:resume:view'],
        },
      ],
    })
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
    expect(await read(`roles/${volunteer.uid}/coordinator`)).toBeNull()
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
    expect(await read(`roles/${volunteer.uid}/coordinator`)).toBeNull()
  })
})

describe('GET /api/v1/user/access', () => {
  it('shows an admin the roles and memberships a user has', async () => {
    const admin = await createUser({ userType: 'admin' })
    const rep = await createUser({ userType: 'company', companyUID: 'acme' })

    const response = await api(`/api/v1/user/access?uid=${rep.uid}`, {
      token: admin.token,
    })

    expect(response.body).toEqual({
      roles: ['company'],
      memberships: [{ companyUID: 'acme', kind: 'employee' }],
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
    expect(listed.find((u) => u.uid === admin.uid)?.access).toEqual({
      roles: ['admin'],
      memberships: [],
    })
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
    expect(Object.keys((await read(`roles/${uid}`)) as object)).toEqual([
      'company',
    ])
  })
})
