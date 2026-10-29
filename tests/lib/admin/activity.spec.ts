import { describe, expect, it } from 'vitest'
import { dailyRows, kindCounts, totalsOf } from '@/lib/admin/activity'
import type { JournalEntry } from '@/domain/activity/activity'
import { Instant } from '@/domain/time'

describe('dailyRows', () => {
  it('lists every day to today, newest first, across a month', () => {
    const rows = dailyRows(
      {
        from: '2026-10-30',
        tallies: [{ day: '2026-10-31', counts: { 'page-view': 4 } }],
      },
      '2026-11-01',
    )
    expect(rows).toEqual([
      { day: '2026-11-01', counts: {} },
      { day: '2026-10-31', counts: { 'page-view': 4 } },
      { day: '2026-10-30', counts: {} },
    ])
  })
})

describe('totalsOf', () => {
  it('sums each tally, with zeros for those never counted', () => {
    const totals = totalsOf([
      { counts: { 'page-view': 4, 'sign-up': 1 } },
      { counts: { 'page-view': 2 } },
    ])
    expect(totals['page-view']).toBe(6)
    expect(totals['sign-up']).toBe(1)
    expect(totals.error).toBe(0)
  })
})

describe('kindCounts', () => {
  it('counts the entries of each kind', () => {
    const entry = (kind: JournalEntry['kind']): JournalEntry => ({
      at: Instant.parse('2026-10-29T10:00:00.000Z'),
      kind,
      method: 'GET',
      path: '/',
      status: 200,
      code: null,
      actor: null,
      target: null,
    })
    expect(
      kindCounts([entry('refused'), entry('refused'), entry('deleted')]),
    ).toEqual({ refused: 2, deleted: 1 })
  })
})
