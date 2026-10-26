import type { StoredUser } from '@/application/users/userRepository'
import type { Applicant } from '@/domain/authorization/eligibility'
import { CompanyUid } from '@/domain/business/company'
import { Term, type StudyYear } from '@/domain/ntnu'
import type { ISO8601String } from '@/domain/time'
import type { Role } from '@/domain/user'

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

/** Read a v1 user record */
export const storedUserOf = (
  record: UserRecord & Record<string, unknown>,
  now: ISO8601String,
): StoredUser => ({
  roles: rolesOf(record.userType),
  applicant: applicantOf(record, now),
  companies: companiesOf(record),
  record,
})
