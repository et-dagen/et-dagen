import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { presentWithinTimeWindow } from '@/server/utils/useTime'

// Registration windows are stored as Oslo wall-clock time without an offset,
// as the admin typed them. Production servers run in UTC.
describe('presentWithinTimeWindow on a server running in UTC', () => {
  const originalTz = process.env.TZ

  beforeEach(() => {
    process.env.TZ = 'UTC'
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    process.env.TZ = originalTz
  })

  const window = ['2026-02-01T10:00', '2026-02-01T12:00'] as const

  it('is open at 10:30 Oslo time in winter (09:30 UTC)', () => {
    vi.setSystemTime(new Date('2026-02-01T09:30:00Z'))
    expect(presentWithinTimeWindow(...window)).toBe(true)
  })

  it('opens on the start minute and closes on the end minute', () => {
    vi.setSystemTime(new Date('2026-02-01T09:00:20Z'))
    expect(presentWithinTimeWindow(...window)).toBe(true)
    vi.setSystemTime(new Date('2026-02-01T11:00:20Z'))
    expect(presentWithinTimeWindow(...window)).toBe(false)
  })

  it('is closed at 09:30 Oslo time in winter (08:30 UTC)', () => {
    vi.setSystemTime(new Date('2026-02-01T08:30:00Z'))
    expect(presentWithinTimeWindow(...window)).toBe(false)
  })

  it('is closed at 12:30 Oslo time in winter (11:30 UTC)', () => {
    vi.setSystemTime(new Date('2026-02-01T11:30:00Z'))
    expect(presentWithinTimeWindow(...window)).toBe(false)
  })

  it('is open at 10:30 Oslo time in summer (08:30 UTC)', () => {
    vi.setSystemTime(new Date('2026-07-01T08:30:00Z'))
    expect(
      presentWithinTimeWindow('2026-07-01T10:00', '2026-07-01T12:00'),
    ).toBe(true)
  })
})
