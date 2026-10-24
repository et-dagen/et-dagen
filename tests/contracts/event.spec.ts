import { describe, expect, it } from 'vitest'
import { EventInput, toV1Event } from '@/contracts/event'

const talk = {
  signup: false,
  title: 'Kick-off',
  companyUID: 'etdagene',
  description: '<p>Opening of the fair.</p>',
  location: { name: 'Stripa', map: '' },
  start: '2026-11-03T12:00',
  end: '2026-11-03T13:00',
}
const workshop = {
  ...talk,
  signup: true,
  capacity: '40',
  opens: '2026-10-20T12:00',
  closes: '2026-11-02T23:59',
  years: [4, 5],
}

const errors = (input: unknown) =>
  EventInput.safeParse(input).error?.issues.map((i) => [
    i.path.join('.'),
    i.message,
  ])

describe('EventInput', () => {
  it('accepts an event without sign-up and one with', () => {
    expect(EventInput.safeParse(talk).success).toBe(true)
    expect(EventInput.parse(workshop)).toMatchObject({
      capacity: 40,
      programmes: [],
    })
  })

  it('names every missing or wrong field', () => {
    expect(
      errors({
        ...workshop,
        title: '',
        description: '<p> </p>',
        location: { name: '', map: 'javascript:alert(1)' },
        start: '3.11.2026',
        capacity: '0',
      }),
    ).toEqual([
      ['title', 'required'],
      ['description', 'required'],
      ['location.name', 'required'],
      ['location.map', 'url'],
      ['start', 'datetime'],
      ['capacity', 'number'],
    ])
  })

  it('checks that times come in order', () => {
    expect(errors({ ...talk, end: '2026-11-03T11:00' })).toEqual([
      ['end', 'end_before_start'],
    ])
    expect(errors({ ...workshop, closes: '2026-11-03T12:30' })).toEqual([
      ['closes', 'signup_after_start'],
    ])
    expect(errors({ ...workshop, closes: '2026-10-19T12:00' })).toEqual([
      ['closes', 'end_before_start'],
    ])
  })
})

describe('toV1Event', () => {
  it('writes what v1 stores', () => {
    expect(toV1Event(EventInput.parse(workshop))).toMatchObject({
      capacity: 40,
      location: { name: 'Stripa', map: null },
      registration: {
        start: '2026-10-20T12:00',
        end: '2026-11-02T23:59',
        requirements: { programmes: null, years: [4, 5] },
      },
    })
    expect(toV1Event(EventInput.parse(talk))).toMatchObject({
      capacity: null,
      registration: { start: null, end: null, requirements: null },
    })
  })
})
