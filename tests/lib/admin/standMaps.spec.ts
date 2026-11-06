import { describe, expect, it } from 'vitest'
import { standMapDays } from '@/lib/admin/standMaps'

const events = {
  a: { date: { start: '2026-11-04T17:15' } },
  b: { date: { start: '2026-11-04T19:00' } },
  c: { date: { start: '2026-11-03T12:00' } },
  past: { date: { start: '2026-02-11T12:00' } },
  undated: {},
}
const maps = [
  { date: '2026-11-04', url: 'u1', name: 'ons.png' },
  { date: '2026-11-06', url: 'u2', name: 'fre.png' },
  { date: '2026-02-11', url: 'old', name: 'feb.png' },
]

describe('standMapDays', () => {
  it('lists today and later days with events or a map, with both', () => {
    expect(standMapDays(events, maps, '2026-10-25')).toEqual([
      { day: '2026-11-03', events: 1, map: null },
      { day: '2026-11-04', events: 2, map: maps[0] },
      { day: '2026-11-06', events: 0, map: maps[1] },
    ])
  })

  it('is empty when nothing is coming up', () => {
    expect(standMapDays(events, maps, '2026-12-01')).toEqual([])
    expect(standMapDays(null, null, '2026-10-25')).toEqual([])
  })
})
