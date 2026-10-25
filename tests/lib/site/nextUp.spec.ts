import { describe, expect, it } from 'vitest'
import { Instant, type ISO8601Literal } from '@/domain/time'
import { nextUp } from '@/lib/site/nextUp'

const events = {
  talk: {
    title: 'Presentasjon',
    date: { start: '2026-11-04T17:15', end: '2026-11-04T19:00' },
  },
  kick: {
    title: 'Kick-off',
    date: { start: '2026-11-04T12:00', end: '2026-11-04T14:00' },
  },
  later: {
    title: 'Bankett',
    date: { start: '2026-11-20T19:00', end: '2026-11-20T23:00' },
  },
  undated: { title: 'Mangler tid' },
}
const at = (iso: ISO8601Literal) => Instant.parse(iso)

describe('nextUp', () => {
  it('names the event on now', () => {
    expect(nextUp(events, at('2026-11-04T11:30:00.000Z'))).toMatchObject({
      kind: 'now',
      uid: 'kick',
    })
  })

  it('names the next event, and whether it is today in Oslo', () => {
    expect(nextUp(events, at('2026-11-04T14:30:00.000Z'))).toMatchObject({
      kind: 'next',
      uid: 'talk',
      today: true,
    })
    expect(nextUp(events, at('2026-11-01T10:00:00.000Z'))).toMatchObject({
      kind: 'next',
      uid: 'kick',
      today: false,
    })
  })

  it('has nothing when the next event is more than a week away, or none is left', () => {
    expect(nextUp(events, at('2026-11-05T10:00:00.000Z'))).toBeNull()
    expect(nextUp(events, at('2026-12-01T10:00:00.000Z'))).toBeNull()
    expect(nextUp(null, at('2026-12-01T10:00:00.000Z'))).toBeNull()
  })
})
