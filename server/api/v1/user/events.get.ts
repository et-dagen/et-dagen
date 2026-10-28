// GET /api/v1/user/events
// endpoint for the events the caller signed up for
import { signUpsOf } from '@/application/events/signUps'
import { Instant } from '@/domain/time'
import { events } from '@/server/composition'

defineRouteMeta({
  openAPI: {
    tags: ['User'],
    summary: "The caller's sign-ups",
    description:
      'The events the signed-in caller is coming to or waiting for, soonest first: ' +
      '`[{ eventUID, start, status: "attending" | "queued", attended?, position? }]`. ' +
      'Event details come from `GET /api/v1/event`.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
  },
})

export default defineEventHandler(async (event) => {
  const { subject } = event.context
  setResourceContext(
    event,
    'user',
    subject?.uid,
    'list',
    "The caller's sign-ups",
  )

  const signUps = await signUpsOf({ events }, { subject, now: Instant.now() })
  addEventContext(event, 'result_count', signUps.length)

  return signUps.map(({ event: eventUID, start, place }) =>
    place.kind === 'attending'
      ? { eventUID, start, status: 'attending', attended: place.attended }
      : { eventUID, start, status: 'queued', position: place.position },
  )
})
