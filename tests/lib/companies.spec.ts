import { describe, expect, it } from 'vitest'
import { companyName } from '@/lib/companies'

describe('companyName', () => {
  it('names a known company and gives an empty string otherwise', () => {
    const companies = { acme: { name: 'Acme' }, nameless: {} }
    expect(companyName(companies, 'acme')).toBe('Acme')
    expect(companyName(companies, 'nameless')).toBe('')
    expect(companyName(companies, 'missing')).toBe('')
    expect(companyName(null, 'acme')).toBe('')
    expect(companyName(companies, undefined)).toBe('')
  })
})
