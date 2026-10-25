/**
 * What every adapter of a port that deletes per user must do: {@link UserDirectory},
 * {@link UserRepository} and {@link UserFiles}
 *
 * An adapter's test file calls {@link describeUserRemoval} with a factory that seeds the store
 * and returns a probe, because the ports themselves cannot read back.
 */
import { describe, expect, it } from 'vitest'
import type { UserDirectory } from '@/application/users/userDirectory'
import type { UserFiles } from '@/application/users/userFiles'
import type { UserRepository } from '@/application/users/userRepository'
import { UserUid } from '@/domain/user'

const [ada, bo, cy] = ['ada', 'bo', 'cy'].map(UserUid.parse)

export interface Seeded {
  store: UserDirectory | UserRepository | UserFiles
  holds(uid: UserUid): Promise<boolean>
}

export function describeUserRemoval(
  adapter: string,
  make: (seed: UserUid[]) => Promise<Seeded> | Seeded,
) {
  describe(`${adapter} removal`, () => {
    it('removes the given users and keeps the rest', async () => {
      const { store, holds } = await make([ada, bo, cy])
      await store.remove([ada, cy])

      expect(await holds(ada)).toBe(false)
      expect(await holds(bo)).toBe(true)
      expect(await holds(cy)).toBe(false)
    })

    it('treats users who are already gone as removed', async () => {
      const { store, holds } = await make([bo])
      await store.remove([ada])
      await store.remove([])
      expect(await holds(bo)).toBe(true)
    })
  })
}
