import type { JobRepository } from '@/application/jobs/jobRepository'
import { jobOf, recordOf, type JobRecord } from '@/application/jobs/jobRecord'
import { JobUid } from '@/domain/business/job'

/** Job records held in a map, keyed by uid, for tests */
export function memoryJobRepository(
  seed: Record<string, JobRecord> = {},
): JobRepository {
  const jobs = new Map(Object.entries(seed))
  // a stored null removes the field, as it does in the Realtime Database
  const withoutNulls = (record: JobRecord): JobRecord =>
    Object.fromEntries(
      Object.entries(record).filter(([, value]) => value !== null),
    )

  return {
    stored: () =>
      Promise.resolve(jobs.size === 0 ? null : Object.fromEntries(jobs)),
    storedOne: (uid) => Promise.resolve(jobs.get(uid) ?? null),
    // a promise even when the record cannot be read, as from a database
    find: (uid) =>
      Promise.resolve(jobs.get(uid)).then((record) =>
        record ? jobOf(uid, record) : null,
      ),
    add: (job) => {
      const uid = JobUid.parse(crypto.randomUUID())
      jobs.set(uid, withoutNulls(recordOf(job)))
      return Promise.resolve(uid)
    },
    update: (uid, changes) => {
      const record = jobs.get(uid)
      if (record)
        jobs.set(uid, withoutNulls({ ...record, ...recordOf(changes) }))
      return Promise.resolve()
    },
    remove: (uid) => {
      jobs.delete(uid)
      return Promise.resolve()
    },
  }
}
