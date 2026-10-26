/**
 * Stored roles, memberships and affiliations (#640) decide the subject; the v1 fields do not
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '@/tests/api/support/api'
import { createUser, resetEmulators, seed } from '@/tests/api/support/emulators'

const subjectFor = async (token: string) =>
  (await api('/api/v1/user/subject', { token })).body as {
    roles: string[]
    companies: Record<string, string[]>
  }

// the database drops empty objects, so a role is stored with when and by whom it was given
const given = { createdAt: '2026-10-26T12:00:00.000Z', createdBy: 'test' }

beforeEach(async () => {
  await resetEmulators()
  await seed('companies', {
    acme: { name: 'Acme', type: 'partner', cvAccess: false },
    globex: { name: 'Globex', type: 'partner', cvAccess: false },
  })
})

describe('stored access', () => {
  it('gives a coordinator every company they are a member of', async () => {
    const { uid, token } = await createUser({
      userType: 'basic',
      studyProgram: 'MTEL',
      currentYear: 3,
    })
    await seed(`roles/${uid}`, { coordinator: given, user: given })
    await seed(`memberships/${uid}`, {
      acme: { kind: 'coordinator' },
      globex: { kind: 'coordinator', endedAt: '2026-01-01T00:00:00.000Z' },
    })

    const subject = await subjectFor(token)

    expect(subject.roles.sort()).toEqual(['coordinator', 'user'])
    expect(Object.keys(subject.companies)).toEqual(['acme'])
  })

  it("takes a company's tier and overrides from its affiliation", async () => {
    await seed('affiliations/acme', {
      tier: 'sponsor',
      overrides: { 'ent:resume:view': true },
    })
    const { uid, token } = await createUser({
      userType: 'company',
      companyUID: 'acme',
    })
    await seed(`roles/${uid}`, { company: given })
    await seed(`memberships/${uid}/acme`, { kind: 'employee' })

    expect((await subjectFor(token)).companies.acme.sort()).toEqual([
      'ent:profile:manage',
      'ent:resume:view',
    ])
  })

  it('ignores the v1 fields of a user without stored roles', async () => {
    const { uid, token } = await createUser()
    // straight to the database, so the test helper adds no roles
    await seed(`users/${uid}`, { userType: 'company', companyUID: 'globex' })

    const response = await api('/api/v1/user/subject', { token })

    expect(response.status).toBe(403)
  })
})
