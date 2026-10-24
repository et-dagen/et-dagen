import { describe, expect, it } from 'vitest'
import { candidates, rosterOf, type Person } from '@/lib/admin/attendees'

const people: Person[] = [
  {
    uid: 'a',
    name: 'Åse Berg',
    email: 'ase@example.com',
    studyProgram: 'Kybernetikk',
    currentYear: '4',
  },
  { uid: 'b', name: '', email: 'bjorn@example.com' },
  { uid: 'c', name: 'Cecilie Dahl', email: 'cecilie@example.com' },
  { uid: 'd', name: 'Didrik Aas', email: 'didrik@example.com' },
]
const byUid = new Map(people.map((person) => [person.uid, person]))

const event = {
  attendants: {
    b: { attended: true, registeredAt: 200 },
    a: { attended: false, registeredAt: 100 },
    gone: { registeredAt: 300 },
  },
  queue: { 1760000000002: 'd', 1760000000001: 'c' },
}

describe('rosterOf', () => {
  it('lists attendees in sign-up order and the queue in the order it moves up', () => {
    const roster = rosterOf(event, byUid)
    expect(roster.attendees.map((a) => a.uid)).toEqual(['a', 'b', 'gone'])
    expect(roster.queue.map((a) => a.uid)).toEqual(['c', 'd'])
  })

  it('names people by name, then email, then id', () => {
    const [a, b, gone] = rosterOf(event, byUid).attendees
    expect(a).toMatchObject({
      name: 'Åse Berg',
      email: 'ase@example.com',
      programme: 'Kybernetikk',
      year: 4,
      attended: false,
    })
    expect(b).toMatchObject({ name: 'bjorn@example.com', attended: true })
    expect(gone).toMatchObject({ name: 'gone', email: null, year: null })
  })

  it('handles an event nobody has signed up for', () => {
    expect(rosterOf({}, byUid)).toEqual({ attendees: [], queue: [] })
  })
})

describe('candidates', () => {
  const roster = rosterOf({ attendants: { a: {} }, queue: { 1: 'c' } }, byUid)

  it('finds people without a place or a spot in the queue', () => {
    expect(candidates(people, roster, 'example').map((p) => p.uid)).toEqual([
      'b',
      'd',
    ])
    expect(candidates(people, roster, 'ase')).toEqual([])
  })

  it('suggests nobody before something is typed, and at most the limit', () => {
    expect(candidates(people, roster, '  ')).toEqual([])
    expect(candidates(people, roster, 'example', 1)).toHaveLength(1)
  })
})
