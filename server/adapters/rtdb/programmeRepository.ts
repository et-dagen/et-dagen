import type { Database } from 'firebase-admin/database'
import type { ProgrammeRepository } from '@/application/fair/programmeRepository'
import {
  DEGREES,
  ProgrammeCode,
  type Degree,
  type Programme,
} from '@/domain/fair/programme'

/**
 * `studyProgrammes/<code>` as stored
 *
 * @remarks
 * v1 called the degree `type`. Some old records are a bare name.
 */
type ProgrammeRecord =
  | { name?: string; type?: string; closed?: boolean }
  | string
  | null

// a type the list does not know offers every year, as an integrated master does
const degreeOf = (type: unknown): Degree =>
  (DEGREES as readonly unknown[]).includes(type)
    ? (type as Degree)
    : 'integrated'

const toProgramme = (
  code: string,
  record: ProgrammeRecord,
): Programme | null => {
  const fields = typeof record === 'string' ? { name: record } : record
  if (!fields?.name) return null
  return {
    code: ProgrammeCode.parse(code),
    name: fields.name,
    degree: degreeOf(fields.type),
    open: fields.closed !== true,
  }
}

const toRecord = ({ name, degree, open }: Programme) => ({
  name,
  type: degree,
  closed: open ? null : true,
})

/** Study programmes under `studyProgrammes/`, keyed by code */
export function rtdbProgrammeRepository(
  db: Pick<Database, 'ref'>,
): ProgrammeRepository {
  // a reference per call: building the adapter must not open a connection
  const programmes = () => db.ref('studyProgrammes')

  return {
    all: async () => {
      const value = ((await programmes().once('value')).val() ?? {}) as Record<
        string,
        ProgrammeRecord
      >
      return Object.entries(value).flatMap(([code, record]) => {
        const programme = toProgramme(code, record)
        return programme ? [programme] : []
      })
    },
    find: async (code) =>
      toProgramme(code, (await programmes().child(code).once('value')).val()),
    save: async (programme) => {
      await programmes().child(programme.code).set(toRecord(programme))
    },
    students: async ({ code, name }) => {
      const users = ((await db.ref('users').once('value')).val() ??
        {}) as Record<string, { studyProgram?: unknown } | null>
      return Object.values(users).filter(
        (user) => user?.studyProgram === code || user?.studyProgram === name,
      ).length
    },
    remove: async (code) => {
      await programmes().child(code).remove()
    },
  }
}
