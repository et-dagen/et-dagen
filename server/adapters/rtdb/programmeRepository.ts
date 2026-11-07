import type { Database } from 'firebase-admin/database'
import type { ProgrammeRepository } from '@/application/fair/programmeRepository'
import {
  DEGREES,
  ProgrammeId,
  type Degree,
  type Programme,
} from '@/domain/fair/programme'

/**
 * `studyProgrammes/<id>` as stored
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

const toProgramme = (id: string, record: ProgrammeRecord): Programme | null => {
  const fields = typeof record === 'string' ? { name: record } : record
  if (!fields?.name) return null
  return {
    id: ProgrammeId.parse(id),
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

/** Study programmes under `studyProgrammes/`, and students' choice under `users/<uid>/studyProgram` */
export function rtdbProgrammeRepository(
  db: Pick<Database, 'ref'>,
): ProgrammeRepository {
  // a reference per call: building the adapter must not open a connection
  const programmes = () => db.ref('studyProgrammes')
  const studentsOn = async (name: string) => {
    const users = ((await db.ref('users').once('value')).val() ?? {}) as Record<
      string,
      { studyProgram?: unknown } | null
    >
    return Object.keys(users).filter((uid) => users[uid]?.studyProgram === name)
  }

  return {
    all: async () => {
      const value = ((await programmes().once('value')).val() ?? {}) as Record<
        string,
        ProgrammeRecord
      >
      return Object.entries(value).flatMap(([id, record]) => {
        const programme = toProgramme(id, record)
        return programme ? [programme] : []
      })
    },
    find: async (id) =>
      toProgramme(id, (await programmes().child(id).once('value')).val()),
    save: async (programme) => {
      await programmes().child(programme.id).set(toRecord(programme))
    },
    rename: async (programme, from) => {
      const moving = await studentsOn(from)
      await db.ref().update({
        [`studyProgrammes/${programme.id}`]: toRecord(programme),
        ...Object.fromEntries(
          moving.map((uid) => [`users/${uid}/studyProgram`, programme.name]),
        ),
      })
      return moving.length
    },
    students: async (name) => (await studentsOn(name)).length,
    remove: async (id) => {
      await programmes().child(id).remove()
    },
  }
}
