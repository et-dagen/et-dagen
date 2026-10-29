import { describe, expect, it } from 'vitest'
import {
  ADMIN_PANELS,
  COMPANY_PANELS,
  isActivePanel,
  panelsFor,
} from '@/lib/admin/panels'

const names = (panels: readonly { name: string }[]) => panels.map((p) => p.name)

describe('panelsFor', () => {
  it('gives an admin every admin panel', () => {
    expect(panelsFor(true, () => false)).toEqual(ADMIN_PANELS)
  })

  it('shows the jobs, profile and résumé panels only to those allowed them', () => {
    expect(names(panelsFor(false, (area) => area === 'profile'))).toEqual([
      'company-events',
      'company-profile',
    ])
    expect(names(panelsFor(false, (area) => area === 'jobs'))).toEqual([
      'company-events',
      'company-jobs',
    ])
    expect(names(panelsFor(false, (area) => area === 'resumes'))).toEqual([
      'company-events',
      'resumes',
    ])
    expect(names(panelsFor(false, () => false))).toEqual(['company-events'])
    expect(names(panelsFor(false))).toEqual(names(COMPANY_PANELS))
  })
})

describe('isActivePanel', () => {
  const events = COMPANY_PANELS.find((p) => p.name === 'company-events')!

  it('lights the events panel on its own page and on the event pages', () => {
    const at = (path: string) =>
      isActivePanel(events, path, events.route, events.below)
    expect(at('/company/admin')).toBe(true)
    expect(at('/company/admin/events/new')).toBe(true)
    expect(at('/company/admin/resumes')).toBe(false)
  })
})
