import { describe, expect, it } from 'vitest'
import { JobInput } from '@/contracts/job'

const valid = {
  listing: 'text',
  title: 'Embedded software engineer',
  companyUID: 'c1',
  jobType: 'full-time',
  location: 'Trondheim',
  deadline: '2026-12-01',
  applicationLink: 'https://example.com/jobs/1',
  description: '<p>Firmware for sensors.</p>',
}

const errors = (input: unknown) =>
  JobInput.safeParse(input).error?.issues.map((i) => [i.path[0], i.message])

describe('JobInput', () => {
  it('accepts a complete job, with or without an application link', () => {
    expect(JobInput.safeParse(valid).success).toBe(true)
    expect(JobInput.safeParse({ ...valid, applicationLink: '' }).success).toBe(
      true,
    )
  })

  it('names each field that is missing or wrong', () => {
    expect(
      errors({
        ...valid,
        title: '  ',
        jobType: 'intern',
        deadline: '1.12.2026',
        applicationLink: 'example.com',
        description: '<p></p>',
      }),
    ).toEqual([
      ['title', 'required'],
      ['jobType', 'required'],
      ['deadline', 'date'],
      ['applicationLink', 'url'],
      ['description', 'required'],
    ])
  })

  it('needs a link but no description for a link listing', () => {
    expect(
      JobInput.safeParse({ ...valid, listing: 'link', description: '' })
        .success,
    ).toBe(true)
    expect(
      errors({
        ...valid,
        listing: 'link',
        applicationLink: '',
        description: '',
      }),
    ).toEqual([['applicationLink', 'required']])
    expect(
      errors({ ...valid, listing: 'link', description: 'x'.repeat(301) }),
    ).toEqual([['description', 'too_long']])
  })
})
