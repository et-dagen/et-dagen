/**
 * Runs the AccessRepository contract against the Realtime Database emulator, and checks what is
 * kept on record
 *
 * Needs `FIREBASE_DATABASE_EMULATOR_HOST`, which `bun run test:api` sets; skipped without it.
 */
import { initializeApp } from 'firebase-admin/app'
import { getDatabase } from 'firebase-admin/database'
import { describe, expect, it } from 'vitest'
import { describeAccessRepository } from '@/tests/application/users/accessRepository.contract'
import { CompanyUid } from '@/domain/business/company'
import { Instant } from '@/domain/time'
import { UserUid } from '@/domain/user'
import { companiesFrom, rolesFrom } from '@/server/adapters/rtdb/accessRecords'
import { rtdbAccessRepository } from '@/server/adapters/rtdb/accessRepository'

const host = process.env.FIREBASE_DATABASE_EMULATOR_HOST

describe.skipIf(!host)('Realtime Database emulator', () => {
  const db = getDatabase(
    initializeApp(
      {
        projectId: 'demo-et-dagen',
        databaseURL: `http://${host}?ns=demo-et-dagen-default-rtdb`,
      },
      'access-repository-contract',
    ),
  )
  const value = async (path: string) => (await db.ref(path).once('value')).val()
  const fresh = async () => {
    await db.ref().update({ roles: null, memberships: null })
    return rtdbAccessRepository(db)
  }

  describeAccessRepository('rtdb', async () => ({
    store: await fresh(),
    held: async (user) => ({
      roles: rolesFrom((await value(`roles/${user}`)) ?? {}).sort(),
      companies: companiesFrom(await value(`memberships/${user}`)).sort(),
    }),
  }))

  const ada = UserUid.parse('ada')
  const admin = UserUid.parse('admin')
  const acme = CompanyUid.parse('acme')
  const first = { at: Instant.parse('2026-10-01T12:00:00.000Z'), by: admin }
  const later = { at: Instant.parse('2026-10-26T12:00:00.000Z'), by: admin }

  it('keeps when a role was given, and ends a membership instead of deleting it', async () => {
    const store = await fresh()
    await store.replace(
      ada,
      {
        roles: ['company'],
        memberships: [{ company: acme, kind: 'employee' }],
      },
      first,
    )
    await store.replace(ada, { roles: ['company'], memberships: [] }, later)

    expect(await value(`roles/${ada}/company`)).toEqual({
      createdAt: first.at,
      createdBy: admin,
    })
    expect(await value(`memberships/${ada}/acme`)).toEqual({
      kind: 'employee',
      createdAt: first.at,
      createdBy: admin,
      endedAt: later.at,
    })
  })
})
