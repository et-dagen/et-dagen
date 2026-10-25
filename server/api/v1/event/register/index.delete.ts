// DELETE /api/v1/event/register/:eventUID

// endpoint for opting out of an event
import {
  withdrawFromEvent,
  type WithdrawResult,
} from '@/application/events/registration'
import { EventUid } from '@/domain/event/event'
import { fail } from '@/domain/errors'
import { Instant } from '@/domain/time'
import { UserUid } from '@/domain/user'
import { subjectOf } from '@/server/adapters/rtdb/userRecord'
import { events } from '@/server/composition'

defineRouteMeta({
  openAPI: {
    tags: ['Event'],
    summary: 'Opt user out of event',
    description:
      'Any authenticated user may opt themselves out. Supplying another userUID requires admin. ' +
      'Promotes the first queued user when a spot frees up. Returns 201, not 204.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    // TODO(api-docs): fill in the request/response schemas below.
    // Shapes are sketched from current handler behaviour - verify each
    // against the handler before uncommenting.
    // requestBody: {
    //   required: true,
    //   content: {
    //     'application/json': {
    //       schema: {
    //         type: 'object',
    //         required: ['eventUID'],
    //         properties: {
    //           eventUID: { type: 'string' },
    //           userUID: { type: 'string', description: 'Admin only' },
    //         },
    //       },
    //     },
    //   },
    // },
    // responses: {
    //   201: { description: 'Opted out, empty body' },
    //   400: { description: 'Error (event/missing-event-id).' },
    //   401: { description: 'Error (event/register/not-owner).' },
    //   404: { description: 'Error (event/register/user-not-registered-or-queued).' },
    // },
  },
})

export default defineEventHandler(async (event) => {
  const { user } = event.context

  const { eventUID, userUID } = await readBody(event)

  // Set resource context for wide event logging
  setResourceContext(
    event,
    'event_registration',
    eventUID,
    'delete',
    'Opt user out of event',
  )
  setLogImportance(event, 'warn')

  // user is not authenticated
  if (!user) {
    setErrorContext(event, {
      code: 'firebase/user-not-found',
      message: 'User not authenticated',
    })
    throw createError({
      statusCode: 401,
      statusMessage: 'Error (firebase/user-not-found).',
    })
  }

  // eventUID is not provided
  if (!eventUID) {
    setErrorContext(event, {
      code: 'event/missing-event-id',
      message: 'Event ID not provided',
    })
    throw createError({
      statusCode: 400,
      statusMessage: 'Error (event/missing-event-id).',
    })
  }

  addEventContext(
    event,
    'is_admin_action',
    Boolean(userUID && userUID !== user.uid),
  )

  const now = Instant.now()
  const result = await withDbTiming(event, `events/${eventUID}`, 'write', () =>
    withdrawFromEvent(
      { events },
      {
        subject: subjectOf(user.uid, user, now),
        event: EventUid.parse(eventUID),
        user: UserUid.parse(userUID || user.uid),
        now,
      },
    ),
  )
  addEventContext(event, 'optout_outcome', result.kind)

  if (result.kind === 'withdrawn' || result.kind === 'dequeued') {
    if (result.kind === 'withdrawn') {
      addEventContext(event, 'queue_promoted', result.promoted !== null)
    }
    // User successfully opted out of event
    sendNoContent(event, 201)
    return
  }
  if (result.kind === 'forbidden') throw fail('event/register/forbidden')

  const refusal = REFUSALS[result.kind]
  setErrorContext(event, { code: refusal.code, message: refusal.message })
  throw createError({
    statusCode: refusal.status,
    statusMessage: `Error (${refusal.code}).`,
  })
})

const NOT_ON_EVENT = {
  status: 404,
  code: 'event/register/user-not-registered-or-queued',
  message: 'User is not registered or queued for this event',
}

/** How v1 answers each refusal; the statuses and messages are its contract */
const REFUSALS: Record<
  Exclude<WithdrawResult['kind'], 'withdrawn' | 'dequeued' | 'forbidden'>,
  { status: number; code: string; message: string }
> = {
  'event-not-found': {
    status: 404,
    code: 'event/not-found',
    message: 'Event not found',
  },
  // v1 had no sign-up check here, so an event without one held nobody to remove
  'no-registration': NOT_ON_EVENT,
  'not-own': {
    status: 401,
    code: 'event/register/not-owner',
    message: 'Non-admin user attempted to opt out another user',
  },
  closed: {
    status: 404,
    code: 'event/register/registration-closed',
    message: 'Registration window is closed',
  },
  'not-registered': NOT_ON_EVENT,
}
