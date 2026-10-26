/**
 * Runs the CompanyRepository contract against the Realtime Database emulator, and reads a user
 * profile back through the user repository
 *
 * Needs `FIREBASE_DATABASE_EMULATOR_HOST`, which `bun run test:api` sets; skipped without it.
 */
import { initializeApp } from 'firebase-admin/app'
import { getDatabase } from 'firebase-admin/database'
import { describe, expect, it } from 'vitest'
import { describeCompanyRepository } from '@/tests/application/companies/companyRepository.contract'
import { CompanyUid } from '@/domain/business/company'
import { Instant } from '@/domain/time'
import { UserUid } from '@/domain/user'
import { rtdbCompanyRepository } from '@/server/adapters/rtdb/companyRepository'
import { rtdbUserRepository } from '@/server/adapters/rtdb/userRepository'

const host = process.env.FIREBASE_DATABASE_EMULATOR_HOST

const TYPES = {
  mainPartner: 'main-partner',
  partner: 'partner',
  sponsor: 'sponsor',
  prior: 'old',
} as const

describe.skipIf(!host)('Realtime Database emulator', () => {
  const db = getDatabase(
    initializeApp(
      {
        projectId: 'demo-et-dagen',
        databaseURL: `http://${host}?ns=demo-et-dagen-default-rtdb`,
      },
      'company-repository-contract',
    ),
  )

  describeCompanyRepository('rtdb', async (seed) => {
    await db.ref('companies').set(
      Object.fromEntries(
        seed.map((company) => [
          company.uid,
          {
            name: company.name,
            type: TYPES[company.relationship],
            cvAccess: company.entitlementOverrides['ent:resume:view'],
          },
        ]),
      ),
    )
    return rtdbCompanyRepository(db)
  })

  it('finds a stored company user, and nobody without a profile', async () => {
    await db.ref('users').set({
      c: { userType: 'company', companyUID: 'acme', name: 'Cy' },
    })
    const users = rtdbUserRepository(db)
    const now = Instant.now()

    const found = await users.find(UserUid.parse('c'), now)
    expect(found).toMatchObject({
      roles: ['company'],
      companies: [CompanyUid.parse('acme')],
      record: { name: 'Cy' },
    })
    expect(await users.find(UserUid.parse('nobody'), now)).toBeNull()
  })
})
