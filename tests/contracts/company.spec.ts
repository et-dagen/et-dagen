import { describe, expect, it } from 'vitest'
import { CompanyInput, toV1Company } from '@/contracts/company'

const valid = {
  name: 'Polarbit AS',
  tier: 'mainPartner',
  webpage: 'https://example.com/polarbit',
  description: 'Embedded systems for harsh climates.',
  resumeAccess: true,
}

const errors = (input: unknown) =>
  CompanyInput.safeParse(input).error?.issues.map((i) => [i.path[0], i.message])

describe('CompanyInput', () => {
  it('accepts a complete company and fills in the optional fields', () => {
    expect(CompanyInput.safeParse(valid).success).toBe(true)
    expect(
      CompanyInput.parse({ name: 'X', tier: 'prior', webpage: 'http://x.no' }),
    ).toMatchObject({ description: '', resumeAccess: false })
  })

  it('refuses a missing name or tier and any address that is not http(s)', () => {
    expect(
      errors({
        ...valid,
        name: ' ',
        tier: 'main-partner',
        webpage: 'javascript:alert(1)',
      }),
    ).toEqual([
      ['name', 'required'],
      ['tier', 'required'],
      ['webpage', 'url'],
    ])
  })
})

describe('toV1Company', () => {
  it('sends the profile, and the tier with résumé access', () => {
    expect(toV1Company(CompanyInput.parse(valid))).toEqual({
      profile: {
        name: 'Polarbit AS',
        webpage: 'https://example.com/polarbit',
        description: 'Embedded systems for harsh climates.',
      },
      affiliation: {
        tier: 'mainPartner',
        overrides: { 'ent:resume:view': true },
      },
    })
  })
})
