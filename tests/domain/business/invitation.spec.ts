import { describe, expect, it } from 'vitest'
import { isPastKeeping, statusOf } from '@/domain/business/invitation'
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

describe('isPastKeeping', () => {
  const at = (iso: string) => Instant.parse(iso as never)

  it('keeps an invitation for 90 days after it runs out', () => {
    expect(isPastKeeping(fresh, at('2027-02-10T09:59:59.999Z'))).toBe(false)
    expect(isPastKeeping(fresh, at('2027-02-10T10:00:00.000Z'))).toBe(true)
  })

  it('counts from when it was used or revoked, not from when it would have run out', () => {
    const joined = {
      ...fresh,
      redeemed: { by: UserUid.parse('u'), at: before },
    }
    const revoked = { ...fresh, revokedAt: before }
    for (const ended of [joined, revoked]) {
      expect(isPastKeeping(ended, at('2027-01-30T09:59:59.999Z'))).toBe(false)
      expect(isPastKeeping(ended, at('2027-01-30T10:00:00.000Z'))).toBe(true)
    }
  })

  it('never removes one that still works', () => {
    expect(isPastKeeping(fresh, before)).toBe(false)
  })
})
