import type { JobRecord } from '@/application/jobs/jobRecord'
import type { Job, JobUid } from '@/domain/business/job'

/** What may change on a stored job */
export type JobChanges = Partial<Omit<Job, 'uid'>>

/** Where job listings are stored */
export interface JobRepository {
  /**
   * Every job exactly as stored, keyed by uid, or null when there are none
   *
   * @remarks
   * For v1 only: its `GET /api/v1/job` has always returned what is stored, including fields and
   * values {@link Job} does not know, and its handlers check ownership against the stored record.
   * New code reads with {@link JobRepository.find}.
   */
  stored(): Promise<Record<string, JobRecord> | null>
  /** One job exactly as stored, or null; see {@link JobRepository.stored} */
  storedOne(uid: JobUid): Promise<JobRecord | null>
  /**
   * null when no job has this uid
   *
   * @throws RangeError when the stored job names no company
   */
  find(uid: JobUid): Promise<Job | null>
  /** Store a new job and return the uid it was given */
  add(job: Omit<Job, 'uid'>): Promise<JobUid>
  /** Change some of a job's fields, keeping the rest. Changing a job that does not exist does nothing. */
  update(uid: JobUid, changes: JobChanges): Promise<void>
  /** Removing a job that does not exist is not an error */
  remove(uid: JobUid): Promise<void>
}
