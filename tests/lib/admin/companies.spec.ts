import { describe, expect, it } from 'vitest'
import { siteLabel } from '@/lib/admin/companies'

describe('siteLabel', () => {
  it('shows the host without www', () => {
    expect(siteLabel('https://www.example.com/careers?x=1')).toBe('example.com')
  })

  it('keeps text that is not a URL', () => {
    expect(siteLabel('example.com')).toBe('example.com')
    expect(siteLabel(undefined)).toBe('')
  })
})
