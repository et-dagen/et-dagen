type StoredUser = Record<string, unknown> & { uid: string }

interface StoredEvent {
  companyUID?: string
  attendants?: Record<string, unknown>
  queue?: Record<string, string>
}

/** What another student may see of an attendant: enough for an event's attendant list */
const ATTENDANT_FIELDS = ['uid', 'name', 'studyProgram'] as const

/** What a company may see of the people on its events, for attendance and catering */
const COMPANY_FIELDS = [
  'uid',
  'name',
  'email',
  'studyProgram',
  'currentYear',
  'dietaryRestrictions',
  'updated',
] as const

const pick = (user: StoredUser, fields: readonly string[]) =>
  Object.fromEntries(fields.filter((f) => f in user).map((f) => [f, user[f]]))

/**
 * The users a non-admin may list, with only the fields they may see
 *
 * @remarks
 * - A company sees the attendants and queue of its own events, and, only if it has résumé
 *   access, every user with a résumé, résumé link included.
 * - Anyone else sees themselves in full, and the name and study programme of users registered
 *   for an event, which the event page lists.
 */
export function visibleUsers(
  viewer: { uid: string; userType?: string; companyUID?: string },
  users: StoredUser[],
  events: Record<string, StoredEvent>,
  companyHasCvAccess: boolean,
): Record<string, unknown>[] {
  if (viewer.userType === 'company') {
    const related = new Set(
      Object.values(events)
        .filter((e) => e.companyUID === viewer.companyUID)
        .flatMap((e) => [
          ...Object.keys(e.attendants ?? {}),
          ...Object.values(e.queue ?? {}),
        ]),
    )
    const fields = companyHasCvAccess
      ? [...COMPANY_FIELDS, 'resume']
      : COMPANY_FIELDS
    return users
      .filter((u) => related.has(u.uid) || (companyHasCvAccess && u.resume))
      .map((u) => pick(u, fields))
  }

  const attendants = new Set(
    Object.values(events).flatMap((e) => Object.keys(e.attendants ?? {})),
  )
  return users
    .filter((u) => u.uid === viewer.uid || attendants.has(u.uid))
    .map((u) => (u.uid === viewer.uid ? u : pick(u, ATTENDANT_FIELDS)))
}
