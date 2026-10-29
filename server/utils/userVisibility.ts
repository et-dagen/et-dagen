import { hasPermission } from '@/domain/authorization/hasPermission'
import type { Environment } from '@/domain/authorization/permissions'
import type { Subject } from '@/domain/authorization/subject'
import { companyOf } from '@/server/utils/companyOf'

type StoredUser = Record<string, unknown> & { uid: string }

interface StoredEvent {
  companyUID?: string
  attendants?: Record<string, unknown>
  queue?: Record<string, string>
}

/** What another student may see of an attendant: enough for an event's attendant list */
const ATTENDANT_FIELDS = ['uid', 'name', 'studyProgram'] as const

/** What a company may see of the people on its events; dietary needs reach it only as counts */
const COMPANY_FIELDS = [
  'uid',
  'name',
  'email',
  'studyProgram',
  'currentYear',
  'updated',
] as const

/** A coordinator books the food for their events, so also sees who needs what */
const COORDINATOR_FIELDS = [...COMPANY_FIELDS, 'dietaryRestrictions'] as const

const pick = (user: StoredUser, fields: readonly string[]) =>
  Object.fromEntries(fields.filter((f) => f in user).map((f) => [f, user[f]]))

/**
 * The users a caller may list, with only the fields they may see
 *
 * @remarks
 * - Admins (`user.list`) see everyone in full.
 * - A company user sees the attendants and queue of the events they may manage, and, with
 *   résumé access, every user with a résumé, résumé link included.
 * - Anyone else sees themselves in full, and the name and study programme of users registered
 *   for an event, which the event page lists. A coordinator also sees the people on the events
 *   they manage as a company user does, with their dietary needs, but no résumés.
 */
export function visibleUsers(
  subject: Subject,
  users: StoredUser[],
  events: Record<string, StoredEvent>,
  env: Environment,
): Record<string, unknown>[] {
  if (hasPermission(subject, 'user', 'list', { scope: 'all' }, env)) {
    return users
  }

  const related = new Set(
    Object.values(events)
      .filter((e) =>
        hasPermission(subject, 'event', 'list', companyOf(e.companyUID), env),
      )
      .flatMap((e) => [
        ...Object.keys(e.attendants ?? {}),
        ...Object.values(e.queue ?? {}),
      ]),
  )

  if (subject.roles.includes('company')) {
    const resumes = hasPermission(
      subject,
      'resume',
      'read',
      { scope: 'all' },
      env,
    )
    const fields = resumes ? [...COMPANY_FIELDS, 'resume'] : COMPANY_FIELDS
    return users
      .filter((u) => related.has(u.uid) || (resumes && u.resume))
      .map((u) => pick(u, fields))
  }

  const attendants = new Set(
    Object.values(events).flatMap((e) => Object.keys(e.attendants ?? {})),
  )
  return users
    .filter(
      (u) =>
        u.uid === subject.uid || attendants.has(u.uid) || related.has(u.uid),
    )
    .map((u) => {
      if (u.uid === subject.uid) return u
      return pick(u, related.has(u.uid) ? COORDINATOR_FIELDS : ATTENDANT_FIELDS)
    })
}
