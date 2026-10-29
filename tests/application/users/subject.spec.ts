import { describe, expect, it } from 'vitest'
import type { StoredUser } from '@/application/users/userRepository'
import { whoIsAsking } from '@/application/users/subject'
import { CompanyUid } from '@/domain/business/company'
import { Instant } from '@/domain/time'
import { UserUid } from '@/domain/user'
import { memoryCompanyRepository } from '@/server/adapters/memory/companyRepository'
import { memoryUserStore } from '@/server/adapters/memory/userStore'

const now = Instant.parse('2026-10-25T12:00:00.000Z')
const [coordinator, student, stranger, employee] = ['co', 'st', 'xx', 'em'].map(
  UserUid.parse,
)
const [acme, bolt, gone] = ['acme', 'bolt', 'gone'].map(CompanyUid.parse)

const companies = memoryCompanyRepository([
  {
    uid: acme,
    name: 'Acme',
    relationship: 'mainPartner',
    entitlementOverrides: { 'ent:resume:view': false },
  },
  {
    uid: bolt,
    name: 'Bolt',
    relationship: 'sponsor',
    entitlementOverrides: { 'ent:resume:view': true },
  },
])

const stored = (user: Partial<StoredUser>): StoredUser => ({
  roles: ['user'],
  applicant: null,
  companies: [],
  record: {},
  ...user,
})

const users = memoryUserStore(
  [coordinator, student, employee],
  new Map([
    [
      coordinator,
      stored({
        roles: ['coordinator'],
        companies: [acme, bolt, gone],
        record: { name: 'Co' },
      }),
    ],
    [student, stored({})],
    [
      employee,
      stored({
        roles: ['company'],
        companies: [bolt],
        withheld: new Map([[bolt, ['ent:resume:view']]]),
      }),
    ],
  ]),
)

describe('whoIsAsking', () => {
  it('resolves each company of a coordinator on its own tier', async () => {
    const asking = await whoIsAsking({ users, companies }, coordinator, now)

    expect(asking?.subject.roles).toEqual(['coordinator'])
    expect(asking?.subject.companies).toEqual(
      new Map([
        [
          acme,
          new Set(['ent:job:manage', 'ent:event:manage', 'ent:profile:manage']),
        ],
        [bolt, new Set(['ent:profile:manage', 'ent:resume:view'])],
      ]),
    )
    expect(asking?.record).toEqual({ name: 'Co' })
  })

  it('leaves out what an admin withheld from the person, not from the company', async () => {
    const asking = await whoIsAsking({ users, companies }, employee, now)
    expect(asking?.subject.companies).toEqual(
      new Map([[bolt, new Set(['ent:profile:manage'])]]),
    )
  })

  it('gives a student no companies', async () => {
    const asking = await whoIsAsking({ users, companies }, student, now)
    expect(asking?.subject).toEqual({
      uid: student,
      roles: ['user'],
      companies: new Map(),
      applicant: null,
    })
  })

  it('gives no subject to a user without a profile', async () => {
    expect(await whoIsAsking({ users, companies }, stranger, now)).toBeNull()
  })
})
