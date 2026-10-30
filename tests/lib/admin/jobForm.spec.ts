import { describe, expect, it } from 'vitest'
import { jobFormOf } from '@/lib/admin/jobForm'

describe('jobFormOf', () => {
  it('edits the date of a deadline stored with a time', () => {
    expect(
      jobFormOf({ title: 'Trainee', deadline: '2026-11-12T23:59' }),
    ).toMatchObject({ deadlineType: 'date', deadline: '2026-11-12' })
  })

  it('reads a job without a deadline type as rolling, and fills the text fields', () => {
    expect(jobFormOf({ title: 'Trainee' })).toEqual({
      listing: 'text',
      title: 'Trainee',
      companyUID: undefined,
      jobType: undefined,
      location: undefined,
      deadlineType: 'rolling',
      deadline: '',
      applicationLink: '',
      description: '',
    })
  })
})
