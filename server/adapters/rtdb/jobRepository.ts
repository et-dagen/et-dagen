import type { Database } from 'firebase-admin/database'
import type { JobRepository } from '@/application/jobs/jobRepository'
import { jobOf, recordOf, type JobRecord } from '@/application/jobs/jobRecord'
import { JobUid } from '@/domain/business/job'

/** Job listings under `jobs/<uid>` in the Realtime Database */
export function rtdbJobRepository(db: Pick<Database, 'ref'>): JobRepository {
  // a reference per call: building the adapter must not open a connection
  const jobs = () => db.ref('jobs')
  // a uid comes from the request; one with a path separator or a character keys cannot hold
  // names no job, rather than a field inside one
  const isKey = (uid: string) => !/[./#$[\]]/.test(uid)
  const read = async (uid: string) =>
    isKey(uid)
      ? ((await jobs().child(uid).once('value')).val() as JobRecord | null)
      : null

  return {
    stored: async () =>
      (await jobs().once('value')).val() as Record<string, JobRecord> | null,
    storedOne: read,
    find: async (uid) => {
      const record = await read(uid)
      return record ? jobOf(uid, record) : null
    },
    add: async (job) => {
      const { key } = await jobs().push(recordOf(job))
      return JobUid.parse(key ?? '')
    },
    update: async (uid, changes) => {
      if (!isKey(uid)) return
      // A transaction, so a job removed meanwhile is not brought back as a stub. The first attempt
      // may run on an empty local cache; writing null back makes the database answer with the
      // stored value and run this again.
      await jobs()
        .child(uid)
        .transaction((record: JobRecord | null) =>
          record === null ? null : { ...record, ...recordOf(changes) },
        )
    },
    remove: async (uid) => {
      if (!isKey(uid)) return
      await jobs().child(uid).remove()
    },
  }
}
