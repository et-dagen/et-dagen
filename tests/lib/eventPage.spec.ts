import { describe, expect, it } from 'vitest'
import { Instant } from '@/domain/time'
import {
  calendarFileOf,
  isEventDay,
  mapEmbedOf,
  meetsRequirements,
  placesOf,
  signupStateOf,
  type PublicEvent,
} from '@/lib/eventPage'

// 12:00 in Oslo on 1 November 2026
const now = Instant.parse('2026-11-01T11:00:00.000Z')
const ada = { uid: 'ada', studyProgram: 'Kybernetikk', currentYear: '4' }

const workshop = (extra: Partial<PublicEvent> = {}): PublicEvent => ({
  title: 'Workshop: grid software',
  capacity: 2,
  date: { start: '2026-11-05T16:15', end: '2026-11-05T19:00' },
  registration: { start: '2026-10-20T12:00', end: '2026-11-04T23:59' },
  location: { name: 'Gamle fysikk, auditorium' },
  ...extra,
})

describe('signupStateOf', () => {
  it('offers a place while there is room, and the queue once full', () => {
    expect(signupStateOf(workshop(), ada, now)).toEqual({ kind: 'open' })
    const full = workshop({ attendants: { bo: {}, cy: {} } })
    expect(signupStateOf(full, ada, now)).toEqual({ kind: 'full' })
  })

  it('shows a place or a queue position before anything else', () => {
    expect(
      signupStateOf(workshop({ attendants: { ada: {} } }), ada, now),
    ).toEqual({
      kind: 'registered',
    })
    const queue = { 1760000000002: 'ada', 1760000000001: 'bo' }
    expect(signupStateOf(workshop({ queue }), ada, now)).toEqual({
      kind: 'queued',
      position: 2,
    })
    const closed = workshop({
      attendants: { ada: {} },
      registration: { start: '2026-10-01T12:00', end: '2026-10-02T12:00' },
    })
    expect(signupStateOf(closed, ada, now)).toEqual({ kind: 'registered' })
  })

  it('knows the window, sign-in and eligibility', () => {
    const later = workshop({
      registration: { start: '2026-11-02T12:00', end: '2026-11-04T23:59' },
    })
    expect(signupStateOf(later, ada, now)).toEqual({
      kind: 'not-open',
      opensAt: Instant.parse('2026-11-02T11:00:00.000Z'),
    })
    expect(signupStateOf(workshop(), null, now)).toEqual({ kind: 'sign-in' })
    const masters = workshop({
      registration: {
        start: '2026-10-20T12:00',
        end: '2026-11-04T23:59',
        requirements: { years: [5] },
      },
    })
    expect(signupStateOf(masters, ada, now)).toEqual({ kind: 'not-eligible' })
  })

  it('has nothing to offer without sign-up or once over', () => {
    expect(signupStateOf(workshop({ capacity: null }), ada, now)).toEqual({
      kind: 'none',
    })
    const over = workshop({
      date: { start: '2026-10-01T16:00', end: '2026-10-01T18:00' },
    })
    expect(signupStateOf(over, ada, now)).toEqual({ kind: 'past' })
  })
})

describe('meetsRequirements', () => {
  it('needs the programme and the year when both are set', () => {
    const event = workshop({
      registration: {
        start: '2026-10-20T12:00',
        end: '2026-11-04T23:59',
        requirements: { programmes: ['Kybernetikk'], years: [4, 5] },
      },
    })
    expect(meetsRequirements(event, ada)).toBe(true)
    expect(meetsRequirements(event, { ...ada, currentYear: '2' })).toBe(false)
    expect(meetsRequirements(event, { ...ada, studyProgram: 'Fysikk' })).toBe(
      false,
    )
  })
})

describe('placesOf', () => {
  it('counts places and the queue, never names', () => {
    expect(
      placesOf(workshop({ attendants: { a: {} }, queue: { 1: 'b' } })),
    ).toEqual({
      taken: 1,
      limit: 2,
      waiting: 1,
    })
  })
})

describe('isEventDay', () => {
  it('compares Oslo calendar days', () => {
    expect(
      isEventDay(workshop(), Instant.parse('2026-11-05T07:00:00.000Z')),
    ).toBe(true)
    expect(isEventDay(workshop(), now)).toBe(false)
  })
})

describe('mapEmbedOf', () => {
  it('embeds a full MazeMap link and nothing else', () => {
    expect(
      mapEmbedOf('https://use.mazemap.com/#v=1&campusid=1&sharepoi=123'),
    ).toBe('https://use.mazemap.com/embed.html#v=1&campusid=1&sharepoi=123')
    expect(mapEmbedOf('https://link.mazemap.com/abc')).toBeNull()
    expect(mapEmbedOf('https://maps.google.com/?q=x')).toBeNull()
    expect(mapEmbedOf('https://use.mazemap.com.evil.io/#x')).toBeNull()
    expect(mapEmbedOf(null)).toBeNull()
  })
})

describe('calendarFileOf', () => {
  it('writes the event in UTC with escaped text', () => {
    const ics = calendarFileOf(
      'e2',
      workshop({ title: 'Workshop; grid, software' }),
      'https://etdagen.no/event/e2',
      now,
    )!
    expect(ics).toContain('DTSTART:20261105T151500Z')
    expect(ics).toContain('DTEND:20261105T180000Z')
    expect(ics).toContain(String.raw`SUMMARY:Workshop\; grid\, software`)
    expect(ics).toContain('LOCATION:Gamle fysikk\\, auditorium')
    expect(ics).toContain('UID:e2@etdagen.no')
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
  })

  it('gives nothing for an event without a start', () => {
    expect(calendarFileOf('e', { title: 'x' }, 'u', now)).toBeNull()
  })
})
