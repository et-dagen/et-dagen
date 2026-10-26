import type { StoredUser } from '@/application/users/userRepository'
import type { Applicant } from '@/domain/authorization/eligibility'
import { CompanyUid } from '@/domain/business/company'
import { Term, type StudyYear } from '@/domain/ntnu'
import type { ISO8601String } from '@/domain/time'
import type { Role } from '@/domain/user'
import {
  companiesFrom,
  rolesFrom,
  type MembershipRecord,
  type RolesRecord,
} from '@/server/adapters/rtdb/accessRecords'

/** The fields of a `users/<uid>` node that decide what its owner may do */
export interface UserRecord {
  userType?: string | null
  studyProgram?: string | null
  currentYear?: number | string | null
  companyUID?: string | null
}

const STUDY_YEARS: readonly number[] = [1, 2, 3, 4, 5]

/** v1 treats everyone who is neither an admin nor a company user as a student */
const rolesOf = (userType: UserRecord['userType']): Role[] =>
  userType === 'admin'
    ? ['admin']
    : userType === 'company'
      ? ['company']
      : ['user']

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

/** A v1 company user acts for the one company its registration code named */
const companiesOf = (record: UserRecord): CompanyUid[] => {
  const company = record.userType === 'company' && record.companyUID
  return company ? [CompanyUid.parse(company)] : []
}

/** What a migrated user has stored besides the profile (#640) */
export interface AccessRecords {
  roles: RolesRecord | null
  memberships: Record<string, MembershipRecord> | null
}

/**
 * Read a user record
 *
 * @remarks
 * A user with stored roles has been migrated, and their memberships decide their companies. Until
 * the migration in #640 has run, a user without them is read from the v1 `userType` and
 * `companyUID`.
 */
export const storedUserOf = (
  record: UserRecord & Record<string, unknown>,
  now: ISO8601String,
  access: AccessRecords = { roles: null, memberships: null },
): StoredUser => {
  const migrated = access.roles && Object.keys(access.roles).length > 0
  return {
    roles: migrated ? rolesFrom(access.roles!) : rolesOf(record.userType),
    applicant: applicantOf(record, now),
    companies: migrated
      ? companiesFrom(access.memberships)
      : companiesOf(record),
    record,
  }
}
