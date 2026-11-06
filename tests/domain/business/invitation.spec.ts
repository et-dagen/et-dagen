import { describe, expect, it } from 'vitest'
import { statusOf } from '@/domain/business/invitation'
import { Instant } from '@/domain/time'
import { UserUid } from '@/domain/user'

const expiresAt = Instant.parse('2026-11-12T10:00:00.000Z')
const before = Instant.parse('2026-11-01T10:00:00.000Z')
const after = Instant.parse('2026-11-12T10:00:00.000Z')
const fresh = { expiresAt, revokedAt: null, redeemed: null }

describe('statusOf', () => {
  it('is pending until it runs out, and expired from then on', () => {
    expect(statusOf(fresh, before)).toBe('pending')
    expect(statusOf(fresh, after)).toBe('expired')
  })

  it('stays joined or revoked whatever the time', () => {
    const joined = {
      ...fresh,
      redeemed: { by: UserUid.parse('u'), at: before },
    }
    expect(statusOf(joined, after)).toBe('joined')
    expect(statusOf({ ...fresh, revokedAt: before }, after)).toBe('revoked')
  })
})
