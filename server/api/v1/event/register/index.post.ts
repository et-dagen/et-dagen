// POST /api/v1/event/register/:eventUID

// endpoint for signing up for an event
import {
  registerForEvent,
  type RegisterResult,
} from '@/application/events/registration'
import { EventUid } from '@/domain/event/event'
import { fail } from '@/domain/errors'
import { Instant } from '@/domain/time'
import { UserUid } from '@/domain/user'
import { events, users } from '@/server/composition'

defineRouteMeta({
  openAPI: {
    tags: ['Event'],
    summary: 'Register user for event',
    description:
      'Any authenticated user may register themselves. Supplying a userUID other than your own ' +
      'requires admin. Registers to the queue when the event is full. Note eventUID and userUID ' +
      'are read from the body, despite the :eventUID in the file header comment.',
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
    //   201: { description: 'Registered or queued, empty body' },
    //   400: { description: 'Error (event/missing-event-id).' },
    //   401: { description: 'Error (event/register/non-admin-user). etc.' },
    //   404: { description: 'Registration closed, already registered, already queued, or requirements not met' },
    // },
  },
})

export default defineEventHandler(async (event) => {
  const { subject } = event.context
  const { eventUID, userUID } = await readBody(event)

  // Set resource context for wide event logging
  setResourceContext(
    event,
    'event_registration',
    eventUID,
    'create',
    'Register user for event',
  )

  // user is not authenticated
  if (!subject) {
    setErrorContext(event, {
      code: 'firebase/auth/user-not-found',
      message: 'User not authenticated',
    })
    throw createError({
      statusCode: 401,
      statusMessage: 'Error (firebase/auth/user-not-found).',
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
    Boolean(userUID && userUID !== subject.uid),
  )

  const now = Instant.now()
  const result = await withDbTiming(event, `events/${eventUID}`, 'write', () =>
    registerForEvent(
      { events, users },
      {
        subject,
        event: EventUid.parse(eventUID),
        user: UserUid.parse(userUID || subject.uid),
        now,
      },
    ),
  )
  addEventContext(event, 'registration_outcome', result.kind)

  if (result.kind === 'registered' || result.kind === 'queued') {
    if (result.kind === 'queued') {
      addEventContext(event, 'queue_position', result.position)
    }
    sendNoContent(event, 201)
    return
  }
  if (result.kind === 'forbidden') throw fail('event/register/forbidden')

  const refusal = REFUSALS[result.kind]
  setErrorContext(event, { code: refusal.code, message: refusal.message })
  throw createError({
    statusCode: refusal.status,
    statusMessage: refusal.statusMessage ?? `Error (${refusal.code}).`,
  })
})

/** How v1 answers each refusal; the statuses and messages are its contract */
const REFUSALS: Record<
  Exclude<RegisterResult['kind'], 'registered' | 'queued' | 'forbidden'>,
  { status: number; code: string; message: string; statusMessage?: string }
> = {
  'event-not-found': {
    status: 404,
    code: 'event/not-found',
    message: 'Event not found',
  },
  'no-registration': {
    status: 404,
    code: 'event/register/registration-unnecessary',
    message: 'Event does not require registration',
  },
  'not-own': {
    status: 401,
    code: 'event/register/non-admin-user',
    message: 'Non-admin user attempted to register another user',
  },
  closed: {
    status: 404,
    code: 'event/register/registration-closed',
    message: 'Registration window is closed',
  },
  'not-eligible': {
    status: 404,
    code: 'register/requirements-not-met',
    message: 'User does not meet registration requirements',
    statusMessage: 'Events: Error (register/requirements-not-met).',
  },
  'user-not-found': {
    status: 401,
    code: 'user/doesnt-exist',
    message: 'Target user does not exist',
  },
  'already-registered': {
    status: 404,
    code: 'event/register/already-registered',
    message: 'User is already registered for this event',
  },
  'already-queued': {
    status: 404,
    code: 'event/register/already-queued',
    message: 'User is already in the queue',
  },
}
