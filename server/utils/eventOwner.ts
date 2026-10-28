import type { H3Event } from 'h3'
import { authorize } from '@/domain/authorization/authorize'
import { hasPermission } from '@/domain/authorization/hasPermission'
import type { Environment } from '@/domain/authorization/permissions'
import type { Subject } from '@/domain/authorization/subject'
import { CompanyUid } from '@/domain/business/company'

/**
 * Authorize an action on a stored event against the company that owns it
 *
 * Ownership is read from the stored event, never from the request body, which the caller controls.
 * A missing event is 404 for a caller who may act only on their own company's events; a caller
 * who may act on any event, such as an admin, passes and the handler decides, as in v1.
 */
export async function authorizeStoredEvent(
  event: H3Event,
  subject: Subject | undefined,
  action: 'update' | 'delete' | 'listAttendants' | 'markAttended',
  eventUID: string,
  env: Environment,
): Promise<void> {
  const path = `events/${eventUID}/companyUID`
  const snapshot = await withDbTiming(event, path, 'read', () =>
    db.ref(path).once('value'),
  )
  const owner: unknown = snapshot.val()

  if (typeof owner === 'string' && owner !== '') {
    const hosted = { companyUid: CompanyUid.parse(owner) }
    authorize(subject, 'event', action, hosted, env)
    return
  }
  if (!subject || hasPermission(subject, 'event', action, undefined, env)) {
    authorize(subject, 'event', action, undefined, env)
    return
  }

  setErrorContext(event, {
    code: 'event/not-found',
    message: 'Event not found',
  })
  throw createError({
    statusCode: 404,
    statusMessage: 'Error (event/not-found).',
  })
}
