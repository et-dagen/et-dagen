import { describe, expect, it } from 'vitest'
import { accessOf, assignAccess, startAccess } from '@/application/users/access'
import type { Access } from '@/domain/authorization/access'
import type { Subject } from '@/domain/authorization/subject'
import { CompanyUid } from '@/domain/business/company'
import { Instant } from '@/domain/time'
import { UserUid, type Role } from '@/domain/user'
import { memoryAccessRepository } from '@/server/adapters/memory/accessRepository'
import { memoryCompanyRepository } from '@/server/adapters/memory/companyRepository'
import { memoryUserStore } from '@/server/adapters/memory/userStore'

const subject = (role: Role): Subject => ({
  uid: UserUid.parse(`${role}-1`),
  roles: [role],
  companies: new Map(),
  applicant: null,
})
const now = Instant.parse('2026-10-26T12:00:00.000Z')
const ada = UserUid.parse('ada')
const acme = CompanyUid.parse('acme')
const coordinator: Access = {
  roles: ['coordinator'],
  memberships: [{ company: acme, kind: 'coordinator' }],
}

const setup = () => {
  const access = memoryAccessRepository()
  const deps = {
    access,
    users: memoryUserStore([ada]),
    companies: memoryCompanyRepository([
      {
        uid: acme,
        name: 'Acme',
        relationship: 'partner',
        entitlementOverrides: {},
      },
    ]),
  }
  return { access, deps }
}

describe('assignAccess', () => {
  it('lets an admin make a student a coordinator of a company', async () => {
    const { access, deps } = setup()
    await assignAccess(deps, {
      subject: subject('admin'),
      user: ada,
      access: coordinator,
      now,
    })
    expect(access.read(ada)).toEqual(coordinator)
  })

  it('drops a student role given next to coordinator', async () => {
    const { access, deps } = setup()
    await assignAccess(deps, {
      subject: subject('admin'),
      user: ada,
      access: { ...coordinator, roles: ['user', 'coordinator'] },
      now,
    })
    expect(access.read(ada)?.roles).toEqual(['coordinator'])
  })

  it('refuses everyone else', async () => {
    const { access, deps } = setup()
    for (const role of ['user', 'company', 'coordinator'] as const) {
      await expect(
        assignAccess(deps, {
          subject: subject(role),
          user: ada,
          access: coordinator,
          now,
        }),
      ).rejects.toMatchObject({ code: 'auth/forbidden' })
    }
    await expect(
      assignAccess(deps, {
        subject: undefined,
        user: ada,
        access: coordinator,
        now,
      }),
    ).rejects.toMatchObject({ code: 'auth/signed-out' })
    expect(access.read(ada)).toBeUndefined()
  })

  it('refuses access that breaks the rules, an unknown user and an unknown company', async () => {
    const { access, deps } = setup()
    const admin = subject('admin')
    const attempts: [UserUid, Access, string][] = [
      [ada, { roles: [], memberships: [] }, 'user/no-roles'],
      [
        ada,
        { roles: ['user'], memberships: coordinator.memberships },
        'user/membership-without-role',
      ],
      [UserUid.parse('nobody'), coordinator, 'user/not-found'],
      [
        ada,
        {
          ...coordinator,
          memberships: [
            { company: CompanyUid.parse('gone'), kind: 'coordinator' },
          ],
        },
        'company/not-found',
      ],
    ]
    for (const [user, given, code] of attempts) {
      await expect(
        assignAccess(deps, { subject: admin, user, access: given, now }),
      ).rejects.toMatchObject({ code })
    }
    expect(access.read(ada)).toBeUndefined()
  })
})

describe('startAccess', () => {
  it('stores a new account as a student', async () => {
    const { access } = setup()
    await startAccess({ access }, { user: ada, now })
    expect(access.read(ada)).toEqual({ roles: ['user'], memberships: [] })
  })
})

describe('accessOf', () => {
  const profiles = memoryUserStore(
    [ada],
    new Map([
      [
        ada,
        { roles: ['company'], applicant: null, companies: [acme], record: {} },
      ],
    ]),
  )

  it('shows an admin what is stored', async () => {
    const access = memoryAccessRepository()
    await access.replace(ada, coordinator, { at: now, by: ada })

    expect(
      await accessOf(
        { access, profiles },
        { subject: subject('admin'), user: ada, now },
      ),
    ).toEqual(coordinator)
  })

  it('shows a user without stored roles as holding none', async () => {
    expect(
      await accessOf(
        { access: memoryAccessRepository(), profiles },
        { subject: subject('admin'), user: ada, now },
      ),
    ).toEqual({ roles: [], memberships: [] })
  })

  it('refuses everyone but admins, and an unknown user', async () => {
    const deps = { access: memoryAccessRepository(), profiles }
    await expect(
      accessOf(deps, { subject: subject('coordinator'), user: ada, now }),
    ).rejects.toMatchObject({ code: 'auth/forbidden' })
    await expect(
      accessOf(deps, {
        subject: subject('admin'),
        user: UserUid.parse('nobody'),
        now,
      }),
    ).rejects.toMatchObject({ code: 'user/not-found' })
  })
})
