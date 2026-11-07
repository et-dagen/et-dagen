import { describe, expect, it } from 'vitest'
import {
  isDueForNotice,
  isPastRetention,
  retentionLimitOf,
} from '@/domain/retention'
import { Instant } from '@/domain/time'

const at = Instant.parse

describe('isPastRetention', () => {
  it('keeps a user until three calendar years after their last activity', () => {
    const lastActive = at('2023-10-24T12:00:00.000Z')

    expect(isPastRetention(lastActive, at('2026-10-24T11:59:59.999Z'))).toBe(
      false,
    )
    expect(isPastRetention(lastActive, at('2026-10-24T12:00:00.000Z'))).toBe(
      true,
    )
  })

  it('moves a limit that would fall on 29 February to 1 March', () => {
    const lastActive = at('2024-02-29T00:00:00.000Z')

    expect(isPastRetention(lastActive, at('2027-02-28T23:59:59.999Z'))).toBe(
      false,
    )
    expect(isPastRetention(lastActive, at('2027-03-01T00:00:00.000Z'))).toBe(
      true,
    )
  })
})

describe('retentionLimitOf', () => {
  it('is the moment three calendar years after the last activity', () => {
    expect(retentionLimitOf(at('2023-10-24T12:00:00.000Z'))).toBe(
      '2026-10-24T12:00:00.000Z',
    )
  })
})

describe('isDueForNotice', () => {
  const lastActive = at('2023-10-24T12:00:00.000Z')

  it('warns from 30 days before the limit until the limit', () => {
    expect(
      isDueForNotice(lastActive, null, at('2026-09-24T11:59:59.999Z')),
    ).toBe(false)
    expect(
      isDueForNotice(lastActive, null, at('2026-09-24T12:00:00.000Z')),
    ).toBe(true)
    expect(
      isDueForNotice(lastActive, null, at('2026-10-24T11:59:59.999Z')),
    ).toBe(true)
    expect(
      isDueForNotice(lastActive, null, at('2026-10-24T12:00:00.000Z')),
    ).toBe(false)
  })

  it('warns once per period of inactivity', () => {
    const now = at('2026-10-01T03:00:00.000Z')

    expect(
      isDueForNotice(lastActive, at('2026-09-25T03:00:00.000Z'), now),
    ).toBe(false)
    // a notice from before the user was last active belongs to an earlier period
    expect(
      isDueForNotice(lastActive, at('2023-09-25T03:00:00.000Z'), now),
    ).toBe(true)
  })
})
