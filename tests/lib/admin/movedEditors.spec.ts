import { describe, expect, it } from 'vitest'
import { movedEditorPath } from '@/lib/admin/movedEditors'

describe('movedEditorPath', () => {
  it('sends an admin to the admin panel', () => {
    expect(movedEditorPath('event', 'abc', true)).toBe('/admin/events/abc')
    expect(movedEditorPath('job', undefined, true)).toBe('/admin/jobs/new')
  })

  it('sends a company user to the company panel', () => {
    expect(movedEditorPath('event', 'abc', false)).toBe(
      '/company/admin/events/abc',
    )
    expect(movedEditorPath('job', undefined, false)).toBe(
      '/company/admin/jobs/new',
    )
  })

  it('keeps companies in the admin panel', () => {
    expect(movedEditorPath('company', '-Nx1', false)).toBe(
      '/admin/companies/-Nx1',
    )
  })
})
