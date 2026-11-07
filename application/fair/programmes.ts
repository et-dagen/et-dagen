import type { ProgrammeRepository } from '@/application/fair/programmeRepository'
import { authorize } from '@/domain/authorization/authorize'
import type { Subject } from '@/domain/authorization/subject'
import { fail } from '@/domain/errors'
import {
  ProgrammeId,
  sameName,
  type Programme,
  type ProgrammeInput,
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
  a.name.localeCompare(b.name, 'nb')

/** Every programme, open or closed, by name */
export async function listProgrammes({
  programmes,
}: Deps): Promise<Programme[]> {
  return (await programmes.all()).sort(byName)
}

async function existing({ programmes }: Deps, id: ProgrammeId) {
  const programme = await programmes.find(id)
  if (!programme) throw fail('programme/not-found')
  return programme
}

/** Students pick by name, so two programmes may not share one */
async function checkNameFree(
  { programmes }: Deps,
  name: string,
  except?: ProgrammeId,
) {
  const taken = (await programmes.all()).some(
    (other) => other.id !== except && sameName(other.name, name),
  )
  if (taken) throw fail('programme/name-taken')
}

/**
 * Add a programme to the list
 *
 * @throws AppError `auth/signed-out`, `auth/forbidden` or `programme/name-taken`
 */
export async function addProgramme(
  deps: Deps,
  { subject, now, input }: AsAdmin & { input: ProgrammeInput },
): Promise<Programme> {
  authorize(subject, 'fair', 'manage', undefined, { now })
  await checkNameFree(deps, input.name)
  const programme: Programme = { id: ProgrammeId.random(), ...input }
  await deps.programmes.save(programme)
  return programme
}

/**
 * Change a programme; a new name moves the students on the old one with it
 *
 * @remarks
 * Renaming is for a programme that keeps going under a new name. A programme that replaces
 * another is added, and the old one closed.
 *
 * @throws AppError `auth/signed-out`, `auth/forbidden`, `programme/not-found` or
 *   `programme/name-taken`
 */
export async function updateProgramme(
  deps: Deps,
  {
    subject,
    now,
    id,
    input,
  }: AsAdmin & { id: ProgrammeId; input: ProgrammeInput },
): Promise<{ programme: Programme; moved: number }> {
  authorize(subject, 'fair', 'manage', undefined, { now })
  const before = await existing(deps, id)
  const programme: Programme = { id, ...input }
  if (before.name === input.name) {
    await deps.programmes.save(programme)
    return { programme, moved: 0 }
  }
  await checkNameFree(deps, input.name, id)
  const moved = await deps.programmes.rename(programme, before.name)
  return { programme, moved }
}

/**
 * Delete a programme no student has, such as one added by mistake
 *
 * @throws AppError `auth/signed-out`, `auth/forbidden`, `programme/not-found` or
 *   `programme/in-use`
 */
export async function removeProgramme(
  deps: Deps,
  { subject, now, id }: AsAdmin & { id: ProgrammeId },
): Promise<void> {
  authorize(subject, 'fair', 'manage', undefined, { now })
  const programme = await existing(deps, id)
  if ((await deps.programmes.students(programme.name)) > 0) {
    throw fail('programme/in-use')
  }
  await deps.programmes.remove(id)
}
