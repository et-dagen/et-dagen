import { search } from '@/lib/admin/listView'

/** What v1 stores under an event for each person with a place */
export interface StoredAttendant {
  attended?: boolean
  registeredAt?: number
}

/** The parts of a user the attendee list shows */
export interface Person {
  uid: string
  email?: string | null
  name?: string | null
  studyProgram?: string | null
  currentYear?: string | number | null
}

export interface Attendee {
  uid: string
  name: string
  email: string | null
  programme: string | null
  year: number | null
  attended: boolean
  registeredAt: number | null
}

export interface Roster {
  /** In the order they signed up */
  attendees: Attendee[]
  /** In the order they will move up */
  queue: Attendee[]
}

function attendeeOf(
  uid: string,
  person: Person | undefined,
  stored: StoredAttendant = {},
): Attendee {
  return {
    uid,
    // someone whose account is gone still holds the place; show the id so they can be removed
    name: person?.name || person?.email || uid,
    email: person?.email || null,
    programme: person?.studyProgram || null,
    year: Number(person?.currentYear) || null,
    attended: stored.attended === true,
    registeredAt: stored.registeredAt ?? null,
  }
}

/** The people with a place and the people waiting, joined with what is known about each */
export function rosterOf(
  event: {
    attendants?: Record<string, StoredAttendant> | null
    queue?: Record<string, string> | null
  },
  people: ReadonlyMap<string, Person>,
): Roster {
  const attendees = Object.entries(event.attendants ?? {})
    .map(([uid, stored]) => attendeeOf(uid, people.get(uid), stored))
    .sort((a, b) => (a.registeredAt ?? 0) - (b.registeredAt ?? 0))
  // v1 moves up the smallest key first
  const queue = Object.keys(event.queue ?? {})
    .sort()
    .map((key) => event.queue![key]!)
    .map((uid) => attendeeOf(uid, people.get(uid)))
  return { attendees, queue }
}

/** Up to `limit` people matching the query who neither have a place nor wait for one */
export function candidates(
  people: readonly Person[],
  roster: Roster,
  query: string,
  limit = 8,
): Person[] {
  if (!query.trim()) return []
  const taken = new Set(
    [...roster.attendees, ...roster.queue].map((attendee) => attendee.uid),
  )
  return search(
    people.filter((person) => !taken.has(person.uid)),
    query,
    (person) => [person.name, person.email, person.studyProgram],
  ).slice(0, limit)
}
