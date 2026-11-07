import { describe, expect, it } from 'vitest'
import { activityOverview } from '@/application/activity/overview'
import { memoryActivityLog } from '@/server/adapters/memory/activityLog'
import type { Subject } from '@/domain/authorization/subject'
import { Instant } from '@/domain/time'
import { UserUid } from '@/domain/user'

const subject = (role: 'admin' | 'user'): Subject => ({
  uid: UserUid.parse(`${role}-1`),
  roles: [role],
  companies: new Map(),
  applicant: null,
})

const now = Instant.parse('2026-10-29T12:00:00.000Z')

describe('activityOverview', () => {
  it('gives an admin the tallies and entries of the last days', async () => {
    const log = memoryActivityLog()
    await log.tally('2026-10-27', { 'page-view': 1 })
    await log.tally('2026-10-28', { 'page-view': 2 })
    const entry = {
      kind: 'refused' as const,
      method: 'GET',
      path: '/api/v1/user',
      status: 401,
      code: 'auth/signed-out',
      actor: null,
      target: null,
    }
    // 23:30 UTC on the 27th is already the 28th in Oslo
    await log.note({ ...entry, at: Instant.parse('2026-10-27T23:30:00.000Z') })
    await log.note({ ...entry, at: Instant.parse('2026-10-27T10:00:00.000Z') })

    const overview = await activityOverview(log, {
      subject: subject('admin'),
      now,
      days: 2,
    })
    expect(overview.from).toBe('2026-10-28')
    expect(overview.tallies).toEqual([
      { day: '2026-10-28', counts: { 'page-view': 2 } },
    ])
    expect(overview.entries.map((e) => e.at)).toEqual([
      '2026-10-27T23:30:00.000Z',
    ])
  })

  it('keeps the span within the journal’s retention', async () => {
    const log = memoryActivityLog()
    const at = (days: number) =>
      activityOverview(log, { subject: subject('admin'), now, days })
    expect((await at(1)).from).toBe('2026-10-29')
    expect((await at(0)).from).toBe('2026-10-29')
    expect((await at(365)).from).toBe('2026-09-30')
  })

  it('refuses anyone but an admin', async () => {
    const log = memoryActivityLog()
    await expect(
      activityOverview(log, { subject: subject('user'), now, days: 7 }),
    ).rejects.toMatchObject({ code: 'auth/forbidden' })
    await expect(
      activityOverview(log, { subject: null, now, days: 7 }),
    ).rejects.toMatchObject({ code: 'auth/signed-out' })
  })
})
