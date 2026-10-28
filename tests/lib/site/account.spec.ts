import { describe, expect, it } from 'vitest'
import type { Area } from '@/lib/auth/areas'
import { accountLinks } from '@/lib/site/account'

const routesFor = (...areas: Area[]) =>
  accountLinks((area) => areas.includes(area)).map((link) => link.route)

describe('accountLinks', () => {
  it('gives everyone their profile', () => {
    expect(routesFor()).toEqual(['/user'])
  })

  it('links a company contact with company access to the company pages', () => {
    expect(routesFor('company', 'jobs')).toEqual(['/user', '/company/admin'])
  })

  it('links an admin to the admin panel instead of the company pages', () => {
    expect(routesFor('admin', 'company', 'events', 'jobs')).toEqual([
      '/user',
      '/admin',
    ])
  })
})
