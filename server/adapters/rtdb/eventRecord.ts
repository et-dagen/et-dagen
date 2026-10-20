import type { StoredEvent } from '@/application/events/eventRepository'
import type { EligibilityRule } from '@/domain/authorization/eligibility'
import { CompanyUid } from '@/domain/business/company'
import { EventUid } from '@/domain/event/event'
import type { Registration } from '@/domain/event/registration'
import type { Roster } from '@/domain/event/roster'
import type { StudyYear } from '@/domain/ntnu'
import { Instant, TimeZone, Zone, type ISO8601String } from '@/domain/time'
import { UserUid } from '@/domain/user'

/**
 * An `events/<uid>` node as v1 writes it
 *
 * @remarks
 * Every field is optional because stored data has drifted from the old types (#543). Times are
 * Oslo wall-clock strings (`YYYY-MM-DDTHH:mm`), `registeredAt` is epoch milliseconds, and queue
 * keys are epoch milliseconds whose sort order is the queue order.
 */
export interface EventRecord {
  companyUID?: string
  capacity?: number | null
  date?: { start?: string; end?: string }
  registration?: {
    start?: string
    end?: string
    requirements?: { programmes?: string[]; years?: number[] }
  } | null
  attendants?: Record<string, { attended?: boolean; registeredAt?: number }>
  queue?: Record<string, string>
  [field: string]: unknown
}

/** v1 entered every time in Norwegian wall-clock time */
const OSLO = TimeZone.parse('Europe/Oslo')

const STUDY_YEARS: readonly number[] = [1, 2, 3, 4, 5]

const instantOf = (field: string, value: string | undefined): ISO8601String => {
  if (!value) throw new RangeError(`Event record has no ${field}`)
  return Zone.fromInput(value, OSLO)
}

/** v1 asks for sign-up exactly when the event has a capacity */
function registrationOf(record: EventRecord): Registration | undefined {
  if (!record.capacity) return undefined

  const start = instantOf('registration.start', record.registration?.start)
  const end = instantOf('registration.end', record.registration?.end)
  const eligibility = eligibilityOf(record.registration?.requirements)
  return {
    period: { start, duration: Instant.durationSince(end, start) },
    attendanceLimit: record.capacity,
    ...(eligibility && { eligibility }),
  }
}

function eligibilityOf(
  requirements: { programmes?: string[]; years?: number[] } | undefined,
): EligibilityRule | undefined {
  const rules: EligibilityRule[] = []
  if (requirements?.programmes?.length) {
    rules.push({ kind: 'programme', programmes: requirements.programmes })
  }
  const years = (requirements?.years ?? []).filter((year) =>
    STUDY_YEARS.includes(year),
  ) as StudyYear[]
  if (years.length) rules.push({ kind: 'year', years })

  if (rules.length <= 1) return rules[0]
  return { kind: 'and', rules }
}

/** The queue in order: v1 keys are epoch milliseconds, so they sort by when users queued */
export const queueOf = (record: EventRecord): [key: string, user: UserUid][] =>
  Object.entries(record.queue ?? {})
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, user]) => [key, UserUid.parse(user)])

export function rosterOf(record: EventRecord): Roster {
  return {
    attendants: new Map(
      Object.entries(record.attendants ?? {}).map(([user, meta]) => [
        UserUid.parse(user),
        {
          attended: meta.attended === true,
          registeredAt: Instant.of(new Date(meta.registeredAt ?? 0)),
        },
      ]),
    ),
    queue: queueOf(record).map(([, user]) => user),
  }
}

/**
 * Read a stored event into the domain
 *
 * @throws RangeError when a time the domain needs is missing or malformed
 */
export const toStoredEvent = (
  uid: string,
  record: EventRecord,
): StoredEvent => {
  const registration = registrationOf(record)
  return {
    event: {
      uid: EventUid.parse(uid),
      companyUid: CompanyUid.parse(record.companyUID ?? ''),
      start: instantOf('date.start', record.date?.start),
      ...(registration && { registration }),
    },
    roster: rosterOf(record),
  }
}

/**
 * Write a roster back in the v1 shape, so v1 handlers and pages keep reading it
 *
 * @param keys Queue keys already stored, kept so v1 sees the same entries. New entries get a key
 *   after every existing one.
 */
export function rosterRecord(
  roster: Roster,
  keys: ReadonlyMap<UserUid, string>,
  at: ISO8601String,
): Pick<EventRecord, 'attendants' | 'queue'> {
  const attendants = Object.fromEntries(
    [...roster.attendants].map(([user, meta]) => [
      user,
      {
        attended: meta.attended,
        registeredAt: Instant.toDate(meta.registeredAt).getTime(),
      },
    ]),
  )

  let last = Math.max(
    0,
    ...[...keys.values()].map(Number).filter(Number.isFinite),
  )
  const queue = Object.fromEntries(
    roster.queue.map((user) => {
      const kept = keys.get(user)
      if (kept) return [kept, user]
      last = Math.max(last + 1, Instant.toDate(at).getTime())
      return [String(last), user]
    }),
  )

  return { attendants, queue }
}
