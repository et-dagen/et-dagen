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
    date: { start: '2026-12-20T19:00', end: '2026-12-20T23:00' },
    attendants: { ada: { attended: false } },
  },
  queued: {
    title: 'Workshop',
    date: { start: '2026-11-05T10:00', end: '2026-11-05T12:00' },
    queue: { '-a': 'bo' },
  },
  undated: { title: 'Mangler tid' },
}
const at = (iso: ISO8601Literal) => Instant.parse(iso)

describe('nextUp for everyone', () => {
  it('names the event on now', () => {
    expect(nextUp(events, at('2026-11-04T11:30:00.000Z'))).toMatchObject({
      kind: 'now',
      uid: 'kick',
      mine: false,
    })
  })

  it('names the next event, and how far away it is', () => {
    expect(nextUp(events, at('2026-11-04T14:30:00.000Z'))).toMatchObject({
      kind: 'next',
      uid: 'talk',
      when: 'today',
    })
    expect(nextUp(events, at('2026-11-01T10:00:00.000Z'))).toMatchObject({
      uid: 'kick',
      when: 'week',
    })
  })

  it('has nothing when the next event is more than a week away', () => {
    expect(nextUp(events, at('2026-11-06T10:00:00.000Z'))).toBeNull()
    expect(nextUp(null, at('2026-12-01T10:00:00.000Z'))).toBeNull()
  })
})

describe('nextUp for a signed-in visitor', () => {
  it('names their own next event first, however far ahead', () => {
    expect(nextUp(events, at('2026-11-04T11:30:00.000Z'), 'ada')).toMatchObject(
      { kind: 'next', uid: 'later', mine: true, when: 'later' },
    )
  })

  it('counts a place in the queue as theirs', () => {
    expect(nextUp(events, at('2026-11-04T15:00:00.000Z'), 'bo')).toMatchObject({
      uid: 'queued',
      mine: true,
      when: 'week',
    })
  })

  it('falls back to the fair’s next event without a sign-up', () => {
    expect(nextUp(events, at('2026-11-04T14:30:00.000Z'), 'cy')).toMatchObject({
      uid: 'talk',
      mine: false,
    })
  })
})
