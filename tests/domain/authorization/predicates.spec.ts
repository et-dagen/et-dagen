import { describe, expect, it } from 'vitest'
import type { Entitlement } from '~/domain/authorization/entitlements'
import { can, canAny } from '~/domain/authorization/predicates'
import type { Subject } from '~/domain/authorization/subject'
import { CompanyUid } from '@/domain/business/company'
import { UserUid } from '@/domain/user'

const co = CompanyUid.parse

const coordinator: Subject = {
  uid: UserUid.parse('u1'),
  roles: ['coordinator'],
  companies: new Map<CompanyUid, ReadonlySet<Entitlement>>([
    [co('a'), new Set(['ent:job:manage', 'ent:event:manage'])],
    [co('b'), new Set(['ent:event:manage'])],
  ]),
}

const student: Subject = {
  uid: UserUid.parse('u2'),
  roles: ['user'],
  companies: new Map(),
}

describe('can', () => {
  it('is true only where the named company carries the entitlement', () => {
    expect(can(coordinator, co('a'), 'ent:job:manage')).toBe(true)
    expect(can(coordinator, co('b'), 'ent:job:manage')).toBe(false)
  })

  it('is false for a company the subject is not attached to', () => {
    expect(can(coordinator, co('c'), 'ent:event:manage')).toBe(false)
    expect(can(student, co('a'), 'ent:event:manage')).toBe(false)
  })
})

describe('canAny', () => {
  it('is true when any one associated company carries it', () => {
    expect(canAny(coordinator, 'ent:job:manage')).toBe(true)
    expect(canAny(coordinator, 'ent:event:manage')).toBe(true)
  })

  it('is false when no associated company carries it', () => {
    expect(canAny(coordinator, 'ent:resume:view')).toBe(false)
    expect(canAny(student, 'ent:resume:view')).toBe(false)
  })
})
