import { describe, expect, it } from 'vitest'
import { isPastRetention } from '@/domain/retention'
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
