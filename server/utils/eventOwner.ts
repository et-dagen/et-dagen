import type { H3Event } from 'h3'

/**
 * Refuse a company user acting on an event their company does not own
 *
 * Ownership is read from the stored event, never from the request body, which the caller controls.
 */
export async function assertCompanyOwnsEvent(
  event: H3Event,
  eventUID: string,
  companyUID: string,
): Promise<void> {
  const path = `events/${eventUID}/companyUID`
  const snapshot = await withDbTiming(event, path, 'read', () =>
    db.ref(path).once('value'),
  )
  const owner = snapshot.val()

  if (owner === null) {
    setErrorContext(event, {
      code: 'event/not-found',
      message: 'Event not found',
    })
    throw createError({
      statusCode: 404,
      statusMessage: 'Error (event/not-found).',
    })
  }

  if (owner !== companyUID) {
    setErrorContext(event, {
      code: 'event/not-owner',
      message: 'Company user does not own this event',
    })
    throw createError({
      statusCode: 401,
      statusMessage: 'Error (event/not-owner).',
    })
  }
}
