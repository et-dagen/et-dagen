import type { EventRepository } from '@/application/events/eventRepository'
import { authorize } from '@/domain/authorization/authorize'
import type { Subject } from '@/domain/authorization/subject'
import type { EventUid } from '@/domain/event/event'
import { placeOf, type Place } from '@/domain/event/roster'
import type { ISO8601String } from '@/domain/time'

/** One event the user signed up for, and where they stand on it */
export interface SignUp {
  event: EventUid
  start: ISO8601String
  place: Place
}

/**
 * The events the signed-in user is coming to or waiting for, soonest first
 *
 * @throws AppError `auth/signed-out` or `auth/forbidden`
 */
export async function signUpsOf(
  deps: { events: EventRepository },
  request: { subject: Subject | undefined; now: ISO8601String },
): Promise<SignUp[]> {
  const { subject, now } = request
  authorize(
    subject,
    'user',
    'read',
    { uid: subject?.uid, scope: 'own' },
    { now },
  )

  return (await deps.events.withUser(subject.uid))
    .flatMap(({ event, roster }) => {
      const place = placeOf(roster, subject.uid)
      return place ? [{ event: event.uid, start: event.start, place }] : []
    })
    .sort((a, b) => a.start.localeCompare(b.start))
}
