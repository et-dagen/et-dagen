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

  it('shows the jobs panel only to company users who may manage jobs', () => {
    expect(names(panelsFor(false, (area) => area === 'jobs'))).toContain(
      'company-jobs',
    )
    expect(names(panelsFor(false, () => false))).toEqual(
      names(COMPANY_PANELS.filter((panel) => panel.name !== 'company-jobs')),
    )
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
