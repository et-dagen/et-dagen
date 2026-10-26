import { describe, expect, it } from 'vitest'
import { entitlementsFor } from '@/domain/authorization/entitlements'
import { Instant } from '@/domain/time'
import { entitledFromAffiliation } from '@/server/adapters/rtdb/accessRecords'
import { entitledCompanyOf } from '@/server/adapters/rtdb/companyRepository'
import { storedUserOf } from '@/server/adapters/rtdb/userRecord'
import { v1AccessUpdate } from '@/server/adapters/rtdb/v1Access'

const now = Instant.parse('2026-10-26T12:00:00.000Z')
const stamp = { createdAt: now, createdBy: 'migration-640' }

const users = {
  boss: { userType: 'admin' },
  rep: { userType: 'company', companyUID: 'acme' },
  student: { userType: 'basic', studyProgram: 'MTEL', currentYear: 3 },
}
const companies = {
  acme: { name: 'Acme', type: 'main-partner', cvAccess: false },
  initech: { name: 'Initech', type: 'sponsor', cvAccess: true },
  hooli: { name: 'Hooli', type: 'old' },
}

describe('v1AccessUpdate', () => {
  const update = v1AccessUpdate(
    { users, companies, roles: {}, affiliations: {} },
    now,
  )

  it('gives every user the role and company the v1 fields gave them', () => {
    expect(update).toMatchObject({
      'roles/boss/admin': stamp,
      'roles/student/user': stamp,
    })
    expect(
      Object.keys(update).filter((p) => p.startsWith('memberships/')),
    ).toEqual(['memberships/rep/acme'])
  })

  it('makes a v1 company user a coordinator of their company', () => {
    expect(update).toMatchObject({
      'roles/rep/coordinator': stamp,
      'memberships/rep/acme': { kind: 'coordinator', ...stamp },
    })
    expect(update).not.toHaveProperty('roles/rep/company')
  })

  it('keeps each company on its tier with résumé access as it was', () => {
    expect(update['affiliations/acme']).toMatchObject({
      tier: 'mainPartner',
      overrides: { 'ent:resume:view': false },
    })
    expect(update['affiliations/initech']).toMatchObject({
      tier: 'sponsor',
      overrides: { 'ent:resume:view': true },
    })
    expect(update['affiliations/hooli']).toMatchObject({ tier: 'prior' })
  })

  it('reads the same companies and entitlements after the migration as before it', () => {
    for (const [uid, record] of Object.entries(companies)) {
      const after = entitledFromAffiliation(
        uid,
        record.name,
        update[`affiliations/${uid}`] as never,
      )
      expect(entitlementsFor(after)).toEqual(
        entitlementsFor(entitledCompanyOf(uid, record)),
      )
    }
    for (const [uid, record] of Object.entries(users)) {
      const roles = Object.fromEntries(
        Object.entries(update)
          .filter(([path]) => path.startsWith(`roles/${uid}/`))
          .map(([path, value]) => [path.split('/')[2], value]),
      )
      const memberships = Object.fromEntries(
        Object.entries(update)
          .filter(([path]) => path.startsWith(`memberships/${uid}/`))
          .map(([path, value]) => [path.split('/')[2], value]),
      )
      const after = storedUserOf(record, now, { roles, memberships })
      const before = storedUserOf(record, now)
      expect(after.companies).toEqual(before.companies)
      expect(after.roles).toEqual(
        before.roles.map((role) => (role === 'company' ? 'coordinator' : role)),
      )
    }
  })

  it('skips users and companies already migrated', () => {
    expect(
      v1AccessUpdate(
        {
          users,
          companies,
          roles: { boss: {}, rep: {}, student: {} },
          affiliations: { acme: {}, initech: {}, hooli: {} },
        },
        now,
      ),
    ).toEqual({})
  })
})

describe('storedUserOf after the migration', () => {
  it('goes by stored roles and active memberships, not the v1 fields', () => {
    const user = storedUserOf({ userType: 'basic' }, now, {
      roles: { coordinator: {}, user: {}, nonsense: {} },
      memberships: {
        acme: { kind: 'coordinator' },
        gone: { kind: 'coordinator', endedAt: now },
      },
    })

    expect(user.roles).toEqual(['coordinator', 'user'])
    expect(user.companies).toEqual(['acme'])
  })
})

describe('entitledFromAffiliation', () => {
  it('reads an unknown tier as a former company and ignores unknown overrides', () => {
    const company = entitledFromAffiliation('acme', 'Acme', {
      tier: 'platinum',
      overrides: { 'ent:job:manage': true, 'ent:everything': true, x: 'yes' },
    })

    expect(company.relationship).toBe('prior')
    expect([...entitlementsFor(company)]).toEqual(['ent:job:manage'])
  })
})
