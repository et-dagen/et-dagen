import { describe, expect, it } from 'vitest'
import { codesByCompany, siteLabel } from '@/lib/admin/companies'

describe('codesByCompany', () => {
  it('groups codes under their company and skips broken records', () => {
    const codes = codesByCompany({
      r1: { code: 'polarbit-a8f2k', companyUID: 'c1' },
      r2: { code: 'havlys-9xk2p', companyUID: 'c5' },
      r3: { code: 'polarbit-b71qq', companyUID: 'c1' },
      r4: { companyUID: 'c2' },
    })
    expect(Object.fromEntries(codes)).toEqual({
      c1: ['polarbit-a8f2k', 'polarbit-b71qq'],
      c5: ['havlys-9xk2p'],
    })
  })

  it('has nothing for no codes', () => {
    expect(codesByCompany(null).size).toBe(0)
  })
})

describe('siteLabel', () => {
  it('shows the host without www', () => {
    expect(siteLabel('https://www.example.com/careers?x=1')).toBe('example.com')
  })

  it('keeps text that is not a URL', () => {
    expect(siteLabel('example.com')).toBe('example.com')
    expect(siteLabel(undefined)).toBe('')
  })
})
