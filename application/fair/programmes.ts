import type { ProgrammeRepository } from '@/application/fair/programmeRepository'
import { authorize } from '@/domain/authorization/authorize'
import type { Subject } from '@/domain/authorization/subject'
import { fail } from '@/domain/errors'
import type {
  Programme,
  ProgrammeCode,
  ProgrammeDetails,
} from '@/domain/fair/programme'
import type { ISO8601String } from '@/domain/time'

interface Deps {
  programmes: ProgrammeRepository
}

interface AsAdmin {
  subject: Subject | undefined
  now: ISO8601String
}

const byName = (a: Programme, b: Programme) =>
  a.name.localeCompare(b.name, 'nb') || a.code.localeCompare(b.code)

/** Every programme, open or closed, by name */
export async function listProgrammes({
  programmes,
}: Deps): Promise<Programme[]> {
  return (await programmes.all()).sort(byName)
}

async function existing({ programmes }: Deps, code: ProgrammeCode) {
  const programme = await programmes.find(code)
  if (!programme) throw fail('programme/not-found')
  return programme
}

/**
 * Add a programme to the list
 *
 * @throws AppError `auth/signed-out`, `auth/forbidden` or `programme/code-taken`
 */
export async function addProgramme(
  deps: Deps,
  { subject, now, programme }: AsAdmin & { programme: Programme },
): Promise<Programme> {
  authorize(subject, 'fair', 'manage', undefined, { now })
  if (await deps.programmes.find(programme.code)) {
    throw fail('programme/code-taken')
  }
  await deps.programmes.save(programme)
  return programme
}

/**
 * Change a programme's name, degree or whether it is open
 *
 * @remarks
 * Students point at the code, so a new name reaches them without touching their profiles.
 *
 * @throws AppError `auth/signed-out`, `auth/forbidden` or `programme/not-found`
 */
export async function updateProgramme(
  deps: Deps,
  {
    subject,
    now,
    code,
    details,
  }: AsAdmin & { code: ProgrammeCode; details: ProgrammeDetails },
): Promise<Programme> {
  authorize(subject, 'fair', 'manage', undefined, { now })
  await existing(deps, code)
  const programme: Programme = { code, ...details }
  await deps.programmes.save(programme)
  return programme
}

/**
 * Delete a programme no student has, such as one added by mistake
 *
 * @throws AppError `auth/signed-out`, `auth/forbidden`, `programme/not-found` or
 *   `programme/in-use`
 */
export async function removeProgramme(
  deps: Deps,
  { subject, now, code }: AsAdmin & { code: ProgrammeCode },
): Promise<void> {
  authorize(subject, 'fair', 'manage', undefined, { now })
  const programme = await existing(deps, code)
  if ((await deps.programmes.students(programme)) > 0) {
    throw fail('programme/in-use')
  }
  await deps.programmes.remove(code)
}
