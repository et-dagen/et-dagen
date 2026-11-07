/**
 * What every {@link RetentionNotices} adapter must do
 *
 * An adapter's test file calls {@link describeRetentionNotices} with a factory for an empty store,
 * so the suite runs once per adapter.
 */
import { describe, expect, it } from 'vitest'
import type { RetentionNotices } from '@/application/users/retentionNotices'
import { Instant } from '@/domain/time'
import { UserUid } from '@/domain/user'

const [ada, bo] = ['ada', 'bo'].map(UserUid.parse)
const first = Instant.parse('2026-09-24T03:00:00.000Z')
const later = Instant.parse('2029-09-24T03:00:00.000Z')

export function describeRetentionNotices(
  adapter: string,
  make: () => Promise<RetentionNotices> | RetentionNotices,
) {
  describe(`${adapter} RetentionNotices`, () => {
    it('starts with no warnings', async () => {
      const notices = await make()
      expect(await notices.all()).toEqual(new Map())
    })

    it('keeps the last warning of each user', async () => {
      const notices = await make()
      await notices.record(ada, first)
      await notices.record(bo, first)
      await notices.record(ada, later)

      expect(await notices.all()).toEqual(
        new Map([
          [ada, later],
          [bo, first],
        ]),
      )
    })

    it('forgets the given users and keeps the rest', async () => {
      const notices = await make()
      await notices.record(ada, first)
      await notices.record(bo, first)

      await notices.remove([ada, UserUid.parse('never-warned')])
      await notices.remove([])

      expect(await notices.all()).toEqual(new Map([[bo, first]]))
    })
  })
}
