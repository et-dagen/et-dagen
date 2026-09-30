import { describe, it, expect } from 'vitest'
import type { H3Event } from 'h3'
import {
  ensureDb,
  setResourceContext,
  trackDbRead,
  trackDbWrite,
  trackDbDelete,
  addEventContext,
  setErrorContext,
  pickSafeQuery,
  withDbTiming,
} from '@/server/utils/wideEventHelpers'
import { createWideEvent, type WideEvent } from '@/server/utils/logger'

// Minimal H3Event stub — helpers only touch event.context.wideEvent
function stubEvent(wideEvent?: WideEvent): H3Event {
  return { context: { wideEvent } } as unknown as H3Event
}

describe('ensureDb', () => {
  it('creates the db block when missing and is idempotent', () => {
    const e = createWideEvent('r', 'GET', '/')
    delete e.db
    const first = ensureDb(e)
    expect(first).toEqual({ queries: 0, reads: 0, writes: 0, operations: [] })
    const second = ensureDb(e)
    expect(second).toBe(first) // same reference, not recreated
  })
})

describe('db tracking helpers', () => {
  it('trackDbRead increments queries + reads and records the op', () => {
    const wideEvent = createWideEvent('r', 'GET', '/')
    trackDbRead(stubEvent(wideEvent), 'users/1')
    expect(wideEvent.db?.queries).toBe(1)
    expect(wideEvent.db?.reads).toBe(1)
    expect(wideEvent.db?.operations).toEqual([{ type: 'read', ref: 'users/1' }])
  })

  it('trackDbWrite increments writes', () => {
    const wideEvent = createWideEvent('r', 'POST', '/')
    trackDbWrite(stubEvent(wideEvent), 'users/1')
    expect(wideEvent.db?.writes).toBe(1)
  })

  it('trackDbDelete counts as a write but records a delete op', () => {
    const wideEvent = createWideEvent('r', 'DELETE', '/')
    trackDbDelete(stubEvent(wideEvent), 'users/1')
    expect(wideEvent.db?.writes).toBe(1)
    expect(wideEvent.db?.operations?.[0].type).toBe('delete')
  })

  it('records a duration when a start time is given', () => {
    const wideEvent = createWideEvent('r', 'GET', '/')
    trackDbRead(stubEvent(wideEvent), 'users/1', Date.now() - 5)
    expect(wideEvent.db?.operations?.[0].duration_ms).toBeGreaterThanOrEqual(0)
  })

  it('is a no-op when no wide event is present', () => {
    expect(() => trackDbRead(stubEvent(undefined), 'users/1')).not.toThrow()
  })
})

describe('context helpers', () => {
  it('setResourceContext sets the resource block', () => {
    const wideEvent = createWideEvent('r', 'GET', '/')
    setResourceContext(stubEvent(wideEvent), 'event', 'e1', 'get', 'Get event')
    expect(wideEvent.resource).toEqual({
      type: 'event',
      id: 'e1',
      action: 'get',
      description: 'Get event',
    })
  })

  it('addEventContext sets arbitrary fields', () => {
    const wideEvent = createWideEvent('r', 'GET', '/')
    addEventContext(stubEvent(wideEvent), 'result_count', 7)
    expect(wideEvent.result_count).toBe(7)
  })

  it('setErrorContext fills defaults', () => {
    const wideEvent = createWideEvent('r', 'GET', '/')
    setErrorContext(stubEvent(wideEvent), { code: 'x', message: 'boom' })
    expect(wideEvent.error).toEqual({
      type: 'Error',
      code: 'x',
      message: 'boom',
      retriable: false,
      stack: undefined,
    })
  })
})

describe('pickSafeQuery', () => {
  it('keeps only allow-listed keys', () => {
    const result = pickSafeQuery(
      { eventUID: 'e1', token: 'secret', page: '2' },
      ['eventUID', 'page'],
    )
    expect(result).toEqual({ eventUID: 'e1', page: '2' })
  })

  it('drops undefined values', () => {
    const result = pickSafeQuery({ eventUID: undefined }, ['eventUID'])
    expect(result).toEqual({})
  })
})

describe('withDbTiming', () => {
  it('tracks a successful operation and returns its result', async () => {
    const wideEvent = createWideEvent('r', 'GET', '/')
    const result = await withDbTiming(
      stubEvent(wideEvent),
      'users/1',
      'read',
      () => Promise.resolve('ok'),
    )
    expect(result).toBe('ok')
    expect(wideEvent.db?.reads).toBe(1)
    expect(wideEvent.db?.operations?.[0]).toMatchObject({
      type: 'read',
      ref: 'users/1',
    })
  })

  it('tracks a failed operation and re-throws', async () => {
    const wideEvent = createWideEvent('r', 'POST', '/')
    await expect(
      withDbTiming(stubEvent(wideEvent), 'users/1', 'write', () =>
        Promise.reject(new Error('db down')),
      ),
    ).rejects.toThrow('db down')
    expect(wideEvent.db?.queries).toBe(1)
    expect(wideEvent.db?.writes).toBe(1)
  })
})
