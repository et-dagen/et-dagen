import type { StoredUser } from '@/application/users/userRepository'
import type { Applicant } from '@/domain/authorization/eligibility'
import { Term, type StudyYear } from '@/domain/ntnu'
import type { ISO8601String } from '@/domain/time'
import {
  companiesFrom,
  rolesFrom,
  withheldFrom,
  type MembershipRecord,
  type RolesRecord,
} from '@/server/adapters/rtdb/accessRecords'

/** The fields of a `users/<uid>` node that decide which events its owner may sign up for */
export interface UserRecord {
  studyProgram?: string | null
  currentYear?: number | string | null
}

const STUDY_YEARS: readonly number[] = [1, 2, 3, 4, 5]

/**
 * v1 stores a study year, not a graduation term, on one scale for every programme: bachelors run
 * from 1 to 3 and masters from 4 to 5. The term is read as if the student finishes after year 5.
 * That is wrong for bachelors, but no stored rule judges graduation, because v1 rules only name
 * programmes and years.
 */
function graduationOf(year: StudyYear, now: ISO8601String): Term {
  const term = Term.at(now)
  const calendarYear = Number(term.slice(0, 4))
  const lastSpring = term.endsWith('autumn') ? calendarYear + 1 : calendarYear
  return Term.parse(`${lastSpring + 5 - year}-spring`)
}

function applicantOf(record: UserRecord, now: ISO8601String): Applicant | null {
  const year = Number(record.currentYear)
  if (!record.studyProgram || !STUDY_YEARS.includes(year)) return null
  return {
    programme: record.studyProgram,
    year: year as StudyYear,
    graduation: graduationOf(year as StudyYear, now),
  }
}

/** Who the user is to the permission table, stored beside the profile */
export interface AccessRecords {
  roles: RolesRecord | null
  memberships: Record<string, MembershipRecord> | null
}

/**
 * Read a user record
 *
 * @remarks
 * Roles and memberships decide what the user may do; the profile only says which events they may
 * sign up for. A user without stored roles may do nothing a role grants.
 */
export const storedUserOf = (
  record: UserRecord & Record<string, unknown>,
  now: ISO8601String,
  access: AccessRecords,
): StoredUser => ({
  roles: rolesFrom(access.roles ?? {}),
  applicant: applicantOf(record, now),
  companies: companiesFrom(access.memberships),
  withheld: withheldFrom(access.memberships),
  record,
})
