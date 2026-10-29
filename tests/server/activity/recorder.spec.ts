import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { memoryActivityLog } from '@/server/adapters/memory/activityLog'
import { activityRecorder } from '@/server/activity/recorder'
import type { FinishedRequest } from '@/server/activity/classify'
import { Instant, type ISO8601String } from '@/domain/time'
import { UserUid } from '@/domain/user'

const request = (
  method: string,
  path: string,
  status = 200,
  overrides: Partial<FinishedRequest> = {},
): FinishedRequest => ({
  method,
  path,
  status,
  code: null,
  actor: null,
  target: null,
  ...overrides,
})

const since = Instant.parse('2026-01-01T00:00:00.000Z')

describe('activityRecorder', () => {
  let at: ISO8601String
  const now = () => at

  beforeEach(() => {
    vi.useFakeTimers()
    at = Instant.parse('2026-10-29T09:00:00.000Z')
  })
  afterEach(() => vi.useRealTimers())

  it('sums tallies in memory and writes them per Oslo day on the interval', async () => {
    const log = memoryActivityLog()
    const recorder = activityRecorder(log, { flushMs: 1000, now })
    recorder.record(request('GET', '/'))
    recorder.record(request('GET', '/programme'))
    at = Instant.parse('2026-10-29T23:30:00.000Z') // already the 30th in Oslo
    recorder.record(request('POST', '/api/v1/user', 201))

    expect(await log.tallies('2026-10-01')).toEqual([])
    await vi.advanceTimersByTimeAsync(1000)
    expect(await log.tallies('2026-10-01')).toEqual([
      { day: '2026-10-29', counts: { 'page-view': 2 } },
      { day: '2026-10-30', counts: { 'sign-up': 1 } },
    ])
  })

  it('notes an entry at once, without the query string', async () => {
    const log = memoryActivityLog()
    const recorder = activityRecorder(log, { now })
    recorder.record(
      request('delete', '/api/v1/job?jobUID=j1', 200, {
        actor: UserUid.parse('admin-1'),
        target: 'j1',
      }),
    )
    await vi.advanceTimersByTimeAsync(0)
    expect(await log.entries(since, 10)).toEqual([
      {
        at,
        kind: 'deleted',
        method: 'DELETE',
        path: '/api/v1/job',
        status: 200,
        code: null,
        actor: 'admin-1',
        target: 'j1',
      },
    ])
  })

  it('notes at most perMinute entries a minute', async () => {
    const log = memoryActivityLog()
    const recorder = activityRecorder(log, { perMinute: 2, now })
    for (let i = 0; i < 5; i++)
      recorder.record(request('GET', '/api/v1/user', 401))
    at = Instant.parse('2026-10-29T09:01:00.000Z')
    recorder.record(request('GET', '/api/v1/user', 401))
    await recorder.flush()

    expect(await log.entries(since, 10)).toHaveLength(3)
    expect(await log.tallies('2026-10-29')).toEqual([
      { day: '2026-10-29', counts: { refusal: 6 } },
    ])
  })

  it('drops expired entries once a day', async () => {
    const log = memoryActivityLog()
    await log.note({
      at: Instant.parse('2026-09-01T00:00:00.000Z'),
      kind: 'failed',
      method: 'GET',
      path: '/',
      status: 500,
      code: null,
      actor: null,
      target: null,
    })
    activityRecorder(log, { now }).record(request('GET', '/'))
    await vi.advanceTimersByTimeAsync(0)
    expect(await log.entries(since, 10)).toEqual([])
  })

  it('reports a failed write instead of throwing', async () => {
    const log = memoryActivityLog()
    const failure = new Error('offline')
    log.note = () => Promise.reject(failure)
    const onError = vi.fn()
    activityRecorder(log, { now, onError }).record(
      request('GET', '/api/v1/user', 403),
    )
    await vi.advanceTimersByTimeAsync(0)
    expect(onError).toHaveBeenCalledWith(failure)
  })
})
