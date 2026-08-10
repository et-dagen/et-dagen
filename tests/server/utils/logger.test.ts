import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  generateRequestId,
  createWideEvent,
  determineOutcome,
  logWideEvent,
  type WideEvent,
} from '@/server/utils/logger'

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

afterEach(() => {
  vi.restoreAllMocks()
  process.env = { ...ORIGINAL_ENV }
})

describe('determineOutcome', () => {
  it('maps status codes to outcomes', () => {
    expect(determineOutcome(200)).toBe('success')
    expect(determineOutcome(204)).toBe('success')
    expect(determineOutcome(400)).toBe('client_error')
    expect(determineOutcome(404)).toBe('client_error')
    expect(determineOutcome(500)).toBe('error')
    expect(determineOutcome(503)).toBe('error')
  })
})

describe('generateRequestId', () => {
  it('uses the req_ prefix and is unique', () => {
    const a = generateRequestId()
    const b = generateRequestId()
    expect(a).toMatch(/^req_[a-z0-9]+_[a-z0-9]+$/)
    expect(a).not.toBe(b)
  })
})

describe('createWideEvent', () => {
  it('seeds required defaults', () => {
    const e = createWideEvent('req_1', 'GET', '/api/event')
    expect(e.request_id).toBe('req_1')
    expect(e.method).toBe('GET')
    expect(e.path).toBe('/api/event')
    expect(e.outcome).toBe('success')
    expect(e.db).toEqual({ queries: 0, reads: 0, writes: 0, operations: [] })
    expect(typeof e.timestamp).toBe('string')
  })

  it('uses SERVICE_NAME env when set', () => {
    process.env.SERVICE_NAME = 'custom-svc'
    expect(createWideEvent('r', 'GET', '/').service).toBe('custom-svc')
  })
})

// Build a minimal event and capture what logWideEvent emits as parsed JSON
function emit(event: WideEvent, level?: Parameters<typeof logWideEvent>[1]) {
  const spies = {
    debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
    info: vi.spyOn(console, 'info').mockImplementation(() => {}),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    error: vi.spyOn(console, 'error').mockImplementation(() => {}),
  }
  logWideEvent(event, level)
  for (const s of Object.values(spies)) {
    if (s.mock.calls.length > 0) {
      return JSON.parse(s.mock.calls[0][0] as string)
    }
  }
  return null
}

describe('logWideEvent', () => {
  it('strips internal _importance from output', () => {
    process.env.NODE_ENV = 'development'
    const e = createWideEvent('r', 'GET', '/')
    e._importance = 'info'
    const out = emit(e, 'info')
    expect(out).not.toBeNull()
    expect(out._importance).toBeUndefined()
  })

  it('masks email in production', () => {
    process.env.NODE_ENV = 'production'
    process.env.LOG_LEVEL = 'info'
    process.env.LOG_SAMPLE_RATE = '1.0'
    const e = createWideEvent('r', 'GET', '/')
    e.user = { uid: 'u1', email: 'alice@example.com' }
    const out = emit(e, 'info')
    expect(out.user.email).toBe('a***@example.com')
  })

  it('keeps full email in development', () => {
    process.env.NODE_ENV = 'development'
    const e = createWideEvent('r', 'GET', '/')
    e.user = { uid: 'u1', email: 'alice@example.com' }
    const out = emit(e, 'info')
    expect(out.user.email).toBe('alice@example.com')
  })

  it('always keeps errors even when sampling would drop them', () => {
    process.env.NODE_ENV = 'production'
    process.env.LOG_LEVEL = 'error'
    process.env.LOG_SAMPLE_RATE = '0'
    const e = createWideEvent('r', 'GET', '/')
    e.status_code = 500
    e.outcome = 'error'
    const out = emit(e, 'error')
    expect(out).not.toBeNull()
    expect(out.status_code).toBe(500)
  })

  it('samples out successful non-admin requests at rate 0 in production', () => {
    process.env.NODE_ENV = 'production'
    process.env.LOG_LEVEL = 'info'
    process.env.LOG_SAMPLE_RATE = '0'
    const e = createWideEvent('r', 'GET', '/')
    e.status_code = 200
    e.outcome = 'success'
    const out = emit(e, 'info')
    expect(out).toBeNull()
  })

  it('always keeps admin requests for audit', () => {
    process.env.NODE_ENV = 'production'
    process.env.LOG_LEVEL = 'info'
    process.env.LOG_SAMPLE_RATE = '0'
    const e = createWideEvent('r', 'GET', '/')
    e.status_code = 200
    e.user = { uid: 'admin1', access_level: 'admin' }
    const out = emit(e, 'info')
    expect(out).not.toBeNull()
  })

  it('suppresses debug-importance events when LOG_LEVEL is info', () => {
    process.env.NODE_ENV = 'production'
    process.env.LOG_LEVEL = 'info'
    const e = createWideEvent('r', 'GET', '/')
    e._importance = 'debug'
    e.status_code = 200
    const out = emit(e, 'info')
    expect(out).toBeNull()
  })

  it('removes stack traces for client errors in production', () => {
    process.env.NODE_ENV = 'production'
    process.env.LOG_LEVEL = 'warn'
    const e = createWideEvent('r', 'GET', '/')
    e.status_code = 400
    e.error = { type: 'Error', code: 'bad', message: 'bad', stack: 'trace' }
    const out = emit(e, 'warn')
    expect(out.error.stack).toBeUndefined()
  })

  it('keeps stack traces for server errors in production', () => {
    process.env.NODE_ENV = 'production'
    process.env.LOG_LEVEL = 'error'
    const e = createWideEvent('r', 'GET', '/')
    e.status_code = 500
    e.outcome = 'error'
    e.error = { type: 'Error', code: 'boom', message: 'boom', stack: 'trace' }
    const out = emit(e, 'error')
    expect(out.error.stack).toBe('trace')
  })
})

// Capture the raw string written to console (not parsed) to inspect colouring
function emitRaw(event: WideEvent, level: Parameters<typeof logWideEvent>[1]) {
  const spy = vi.spyOn(console, level ?? 'info').mockImplementation(() => {})
  logWideEvent(event, level)
  return spy.mock.calls.length > 0 ? (spy.mock.calls[0][0] as string) : null
}

describe('log colouring', () => {
  it('wraps the line in ANSI colour when LOG_COLOR=always', () => {
    process.env.NODE_ENV = 'development'
    process.env.LOG_COLOR = 'always'
    const e = createWideEvent('r', 'GET', '/')
    e.status_code = 500
    e.outcome = 'error'
    const raw = emitRaw(e, 'error')
    expect(raw).not.toBeNull()
    expect(raw!.startsWith('\x1B[31m')).toBe(true) // red for error
    expect(raw!.endsWith('\x1B[0m')).toBe(true)
    // payload between the codes is still valid JSON
    const json = raw!.slice(5, -4)
    expect(() => JSON.parse(json)).not.toThrow()
  })

  it('emits plain JSON when LOG_COLOR=never', () => {
    process.env.NODE_ENV = 'development'
    process.env.LOG_COLOR = 'never'
    const e = createWideEvent('r', 'GET', '/')
    e.status_code = 500
    e.outcome = 'error'
    const raw = emitRaw(e, 'error')
    expect(raw).not.toBeNull()
    expect(raw!.includes('\x1B[')).toBe(false)
    expect(() => JSON.parse(raw!)).not.toThrow()
  })
})
