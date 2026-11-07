/**
 * What every {@link ActivityLog} adapter must do
 *
 * An adapter's test file calls {@link describeActivityLog} with a factory, so the suite runs once
 * per adapter.
 */
import { describe, expect, it } from 'vitest'
import type { ActivityLog } from '@/application/activity/activityLog'
import type { JournalEntry } from '@/domain/activity/activity'
import { Instant, type ISO8601Literal } from '@/domain/time'
import { UserUid } from '@/domain/user'

const entry = (
  at: ISO8601Literal,
  overrides: Partial<JournalEntry> = {},
): JournalEntry => ({
  at: Instant.parse(at),
  kind: 'refused',
  method: 'GET',
  path: '/api/v1/user',
  status: 401,
  code: 'auth/signed-out',
  actor: null,
  target: null,
  ...overrides,
})

export function describeActivityLog(
  adapter: string,
  make: () => Promise<ActivityLog> | ActivityLog,
) {
  describe(`${adapter} ActivityLog`, () => {
    it('lists entries since an instant, newest first, up to a limit', async () => {
      const log = await make()
      const deleted = entry('2026-10-29T10:00:00.000Z', {
        kind: 'deleted',
        method: 'DELETE',
        path: '/api/v1/job',
        status: 200,
        code: null,
        actor: UserUid.parse('admin-1'),
        target: 'job-1',
      })
      await log.note(entry('2026-10-28T10:00:00.000Z'))
      await log.note(deleted)
      await log.note(entry('2026-10-29T11:00:00.000Z'))

      const since = Instant.parse('2026-10-29T00:00:00.000Z')
      const newest = await log.entries(since, 10)
      expect(newest.map((e) => e.at)).toEqual([
        '2026-10-29T11:00:00.000Z',
        '2026-10-29T10:00:00.000Z',
      ])
      expect(newest[1]).toEqual(deleted)
      expect(await log.entries(since, 1)).toHaveLength(1)
    })

    it('adds tallies up per day, and lists the days from one on', async () => {
      const log = await make()
      await log.tally('2026-10-28', { 'page-view': 3 })
      await log.tally('2026-10-29', { 'page-view': 2, 'sign-up': 1 })
      await Promise.all([
        log.tally('2026-10-29', { 'page-view': 5 }),
        log.tally('2026-10-29', { 'sign-up': 1 }),
      ])

      expect(await log.tallies('2026-10-29')).toEqual([
        { day: '2026-10-29', counts: { 'page-view': 7, 'sign-up': 2 } },
      ])
      expect((await log.tallies('2026-10-01')).map((t) => t.day)).toEqual([
        '2026-10-28',
        '2026-10-29',
      ])
    })

    it('forgets entries before an instant and keeps the tallies', async () => {
      const log = await make()
      await log.note(entry('2026-09-01T10:00:00.000Z'))
      await log.note(entry('2026-10-29T10:00:00.000Z'))
      await log.tally('2026-09-01', { refusal: 1 })

      await log.forget(Instant.parse('2026-10-01T00:00:00.000Z'))

      const all = await log.entries(
        Instant.parse('2026-01-01T00:00:00.000Z'),
        10,
      )
      expect(all.map((e) => e.at)).toEqual(['2026-10-29T10:00:00.000Z'])
      expect(await log.tallies('2026-09-01')).toEqual([
        { day: '2026-09-01', counts: { refusal: 1 } },
      ])
    })
  })
}
