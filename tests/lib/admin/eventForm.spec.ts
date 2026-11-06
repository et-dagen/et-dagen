import { describe, expect, it } from 'vitest'
import { eventFormOf } from '@/lib/admin/eventForm'

describe('eventFormOf', () => {
  it('turns on sign-up for an event with a capacity, and reads its window and rules', () => {
    expect(
      eventFormOf({
        title: 'Lunsjforedrag',
        capacity: 40,
        location: { name: 'EL5', map: null },
        date: { start: '2026-11-12T11:15', end: '2026-11-12T12:00' },
        registration: {
          start: '2026-10-20T08:00',
          end: null,
          requirements: { programmes: ['MTEL'], years: ['3' as never] },
        },
      }),
    ).toMatchObject({
      signup: true,
      capacity: 40,
      location: { name: 'EL5', map: '' },
      start: '2026-11-12T11:15',
      opens: '2026-10-20T08:00',
      closes: undefined,
      programmes: ['MTEL'],
      years: [3],
    })
  })

  it('leaves sign-up off without a capacity', () => {
    expect(eventFormOf({ title: 'Stand' })).toMatchObject({
      signup: false,
      description: '',
      programmes: [],
      years: [],
    })
  })
})
