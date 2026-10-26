/**
 * What every adapter of {@link AccessRepository} must do
 *
 * An adapter's test file calls {@link describeAccessRepository} with a factory that returns the
 * store and a probe, because the port itself cannot read back.
 */
import { describe, expect, it } from 'vitest'
import type { AccessRepository } from '@/application/users/accessRepository'
import type { Access } from '@/domain/authorization/access'
import { CompanyUid } from '@/domain/business/company'
import { Instant } from '@/domain/time'
import { UserUid } from '@/domain/user'

const ada = UserUid.parse('ada')
const [acme, globex] = ['acme', 'globex'].map(CompanyUid.parse)
const stamp = { at: Instant.parse('2026-10-26T12:00:00.000Z'), by: ada }

export interface Probed {
  store: AccessRepository
  /** The user's roles and the companies they still act for, each sorted */
  held(user: UserUid): Promise<{ roles: string[]; companies: string[] }>
}

export function describeAccessRepository(
  adapter: string,
  make: () => Promise<Probed> | Probed,
) {
  describe(`${adapter} access`, () => {
    const coordinator: Access = {
      roles: ['user', 'coordinator'],
      memberships: [
        { company: acme, kind: 'coordinator' },
        { company: globex, kind: 'coordinator' },
      ],
    }

    it('stores roles and memberships', async () => {
      const { store, held } = await make()
      await store.replace(ada, coordinator, stamp)

      expect(await held(ada)).toEqual({
        roles: ['coordinator', 'user'],
        companies: ['acme', 'globex'],
      })
    })

    it('replaces what the user had', async () => {
      const { store, held } = await make()
      await store.replace(ada, coordinator, stamp)
      await store.replace(
        ada,
        {
          roles: ['company'],
          memberships: [{ company: globex, kind: 'employee' }],
        },
        stamp,
      )

      expect(await held(ada)).toEqual({
        roles: ['company'],
        companies: ['globex'],
      })
    })

    it('finds what was stored, without memberships taken away', async () => {
      const { store } = await make()
      expect(await store.find(ada)).toBeNull()

      await store.replace(ada, coordinator, stamp)
      await store.replace(
        ada,
        { ...coordinator, memberships: coordinator.memberships.slice(1) },
        stamp,
      )

      const found = await store.find(ada)
      expect(found?.roles.sort()).toEqual(['coordinator', 'user'])
      expect(found?.memberships).toEqual([
        { company: globex, kind: 'coordinator' },
      ])
    })

    it('lets a user act for a company again after leaving it', async () => {
      const { store, held } = await make()
      await store.replace(ada, coordinator, stamp)
      await store.replace(ada, { roles: ['user'], memberships: [] }, stamp)
      await store.replace(ada, coordinator, stamp)

      expect((await held(ada)).companies).toEqual(['acme', 'globex'])
    })
  })
}
