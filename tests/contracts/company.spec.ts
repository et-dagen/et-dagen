import { describe, expect, it } from 'vitest'
import { CompanyInput } from '@/contracts/company'

const valid = {
  name: 'Polarbit AS',
  type: 'main-partner',
  webpage: 'https://example.com/polarbit',
  description: 'Embedded systems for harsh climates.',
  cvAccess: true,
}

const errors = (input: unknown) =>
  CompanyInput.safeParse(input).error?.issues.map((i) => [i.path[0], i.message])

describe('CompanyInput', () => {
  it('accepts a complete company and fills in the optional fields', () => {
    expect(CompanyInput.safeParse(valid).success).toBe(true)
    expect(
      CompanyInput.parse({ name: 'X', type: 'old', webpage: 'http://x.no' }),
    ).toMatchObject({ description: '', cvAccess: false })
  })

  it('refuses a missing name or type and any address that is not http(s)', () => {
    expect(
      errors({
        ...valid,
        name: ' ',
        type: 'gold',
        webpage: 'javascript:alert(1)',
      }),
    ).toEqual([
      ['name', 'required'],
      ['type', 'required'],
      ['webpage', 'url'],
    ])
  })
})
