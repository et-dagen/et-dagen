/**
 * What every {@link JobRepository} adapter must do
 *
 * An adapter's test file calls {@link describeJobRepository} with a factory that seeds the
 * given records, so the suite runs once per adapter.
 */
import { describe, expect, it } from 'vitest'
import type { JobRecord } from '@/application/jobs/jobRecord'
import type { JobRepository } from '@/application/jobs/jobRepository'
import { CompanyUid } from '@/domain/business/company'
import { JobUid, type Job } from '@/domain/business/job'

const acme = CompanyUid.parse('acme')

const engineer = {
  companyUid: acme,
  title: 'Engineer',
  description: '<p>Build things</p>',
  type: 'full-time',
  location: 'Trondheim',
  listing: 'text',
  applicationLink: '',
  deadlineType: 'date',
  deadline: '2026-12-01',
} satisfies Omit<Job, 'uid'>

export function describeJobRepository(
  adapter: string,
  make: (
    seed?: Record<string, JobRecord>,
  ) => Promise<JobRepository> | JobRepository,
) {
  describe(`${adapter} JobRepository`, () => {
    it('adds a job, finds it, and stores it in the v1 shape', async () => {
      const jobs = await make()
      const uid = await jobs.add(engineer)

      expect(await jobs.find(uid)).toEqual({ uid, ...engineer })
      expect(await jobs.storedOne(uid)).toEqual({
        companyUID: 'acme',
        title: 'Engineer',
        description: '<p>Build things</p>',
        jobType: 'full-time',
        location: 'Trondheim',
        listing: 'text',
        applicationLink: '',
        deadlineType: 'date',
        deadline: '2026-12-01',
      })
      expect(await jobs.stored()).toEqual({
        [uid]: await jobs.storedOne(uid),
      })
    })

    it('returns stored records as they are, and reads them with defaults', async () => {
      const old = { companyUID: 'acme', title: 'Summer', jobType: 'summer' }
      const jobs = await make({ old })
      const uid = JobUid.parse('old')

      expect(await jobs.stored()).toEqual({ old })
      expect(await jobs.find(uid)).toEqual({
        uid,
        companyUid: acme,
        title: 'Summer',
        description: '',
        type: null,
        location: '',
        listing: 'text',
        applicationLink: '',
        deadlineType: 'date',
        deadline: null,
      })
    })

    it('answers null for a job that is not there', async () => {
      const jobs = await make()
      expect(await jobs.stored()).toBeNull()
      expect(await jobs.storedOne(JobUid.parse('missing'))).toBeNull()
      expect(await jobs.find(JobUid.parse('missing'))).toBeNull()
    })

    it('finds nothing for a uid that points inside a job', async () => {
      const jobs = await make({ j1: { companyUID: 'acme', title: 'Engineer' } })
      const inside = JobUid.parse('j1/title')

      expect(await jobs.storedOne(inside)).toBeNull()
      await jobs.update(inside, { title: 'Changed' })
      await jobs.remove(inside)
      expect(await jobs.stored()).toEqual({
        j1: { companyUID: 'acme', title: 'Engineer' },
      })
    })

    it('refuses to read a job that names no company', async () => {
      const jobs = await make({ broken: { title: 'Lost' } })
      await expect(jobs.find(JobUid.parse('broken'))).rejects.toThrow(
        RangeError,
      )
    })

    it('changes the given fields and keeps the rest, unknown ones too', async () => {
      const jobs = await make({
        j1: {
          companyUID: 'acme',
          title: 'Old',
          deadline: '2026-12-01',
          extra: 'kept',
        },
      })
      const uid = JobUid.parse('j1')
      await jobs.update(uid, {
        title: 'New',
        companyUid: CompanyUid.parse('globex'),
        deadlineType: 'asap',
        deadline: null,
      })

      expect(await jobs.storedOne(uid)).toEqual({
        companyUID: 'globex',
        title: 'New',
        deadlineType: 'asap',
        extra: 'kept',
      })
    })

    it('does not bring back a job that is not there when changing it', async () => {
      const jobs = await make()
      await jobs.update(JobUid.parse('gone'), { title: 'Ghost' })
      expect(await jobs.storedOne(JobUid.parse('gone'))).toBeNull()
    })

    it('removes a job, and removing it again is no error', async () => {
      const jobs = await make()
      const uid = await jobs.add(engineer)
      await jobs.remove(uid)
      await jobs.remove(uid)
      expect(await jobs.find(uid)).toBeNull()
    })
  })
}
