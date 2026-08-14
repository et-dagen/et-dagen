/**
 * Helper utilities for enriching wide events in route handlers
 *
 * These helpers make it easy to add business context to the wide event
 * without having to manage the event structure directly.
 */

import type { H3Event } from 'h3'
import type { WideEvent, LogImportance } from './logger'

type DbBlock = NonNullable<WideEvent['db']>
type DbOpType = 'read' | 'write' | 'delete'

/**
 * Lazily create and return the db block on a wide event.
 * Single source of truth for the db block shape — avoids repeating the
 * zeroed literal across every tracking helper.
 */
export function ensureDb(wideEvent: WideEvent): DbBlock {
  wideEvent.db = wideEvent.db ?? {
    queries: 0,
    reads: 0,
    writes: 0,
    operations: [],
  }
  return wideEvent.db
}

/**
 * Record a single db operation: bump counters and append to operations.
 * Deletes count as writes.
 */
function recordDbOp(
  wideEvent: WideEvent,
  type: DbOpType,
  ref: string,
  durationMs?: number,
): void {
  const db = ensureDb(wideEvent)
  db.queries++
  if (type === 'read') {
    db.reads++
  } else {
    db.writes++
  }
  db.operations?.push(
    durationMs === undefined
      ? { type, ref }
      : { type, ref, duration_ms: durationMs },
  )
}

/**
 * Set the log importance for this request
 * Use this to mark low-priority requests (like image fetches) as 'debug'
 * so they're only logged when LOG_LEVEL=debug
 *
 * - 'debug': Low importance - image fetches, static data reads
 * - 'info': Normal importance - standard API calls (default)
 * - 'warn': High importance - mutations, sensitive operations
 * - 'error': Critical - should always be logged
 *
 * Note: Errors and slow requests are ALWAYS logged regardless of this setting.
 */
export function setLogImportance(
  event: H3Event,
  importance: LogImportance,
): void {
  const { wideEvent } = event.context
  if (!wideEvent) return

  wideEvent._importance = importance
}

/**
 * Set resource context on the wide event
 * Call this at the start of a route handler to identify what resource is being accessed
 *
 * @param event - H3 event
 * @param resourceType - Type of resource (e.g., 'event', 'user', 'job')
 * @param resourceId - ID of the specific resource (if applicable)
 * @param action - Action being performed (e.g., 'create', 'list', 'get', 'update', 'delete')
 * @param description - Human-readable description of what the endpoint does (e.g., 'Register user for event')
 */
export function setResourceContext(
  event: H3Event,
  resourceType: string,
  resourceId: string | undefined,
  action: string,
  description?: string,
): void {
  const { wideEvent } = event.context
  if (!wideEvent) return

  wideEvent.resource = {
    type: resourceType,
    id: resourceId,
    action,
    description,
  }
}

/**
 * Track a database read operation
 */
export function trackDbRead(
  event: H3Event,
  ref: string,
  startTime?: number,
): void {
  const { wideEvent } = event.context
  if (!wideEvent) return

  recordDbOp(
    wideEvent,
    'read',
    ref,
    startTime ? Date.now() - startTime : undefined,
  )
}

/**
 * Track a database write operation
 */
export function trackDbWrite(
  event: H3Event,
  ref: string,
  startTime?: number,
): void {
  const { wideEvent } = event.context
  if (!wideEvent) return

  recordDbOp(
    wideEvent,
    'write',
    ref,
    startTime ? Date.now() - startTime : undefined,
  )
}

/**
 * Track a database delete operation
 */
export function trackDbDelete(
  event: H3Event,
  ref: string,
  startTime?: number,
): void {
  const { wideEvent } = event.context
  if (!wideEvent) return

  recordDbOp(
    wideEvent,
    'delete',
    ref,
    startTime ? Date.now() - startTime : undefined,
  )
}

/**
 * Add custom business context to the wide event
 * Use this for domain-specific data that doesn't fit in the standard fields
 */
export function addEventContext(
  event: H3Event,
  key: string,
  value: unknown,
): void {
  const { wideEvent } = event.context
  if (!wideEvent) return

  wideEvent[key] = value
}

/**
 * Set error context on the wide event
 * Call this when catching an error before re-throwing
 */
export function setErrorContext(
  event: H3Event,
  error: {
    type?: string
    code: string
    message: string
    retriable?: boolean
    stack?: string
  },
): void {
  const { wideEvent } = event.context
  if (!wideEvent) return

  wideEvent.error = {
    type: error.type ?? 'Error',
    code: error.code,
    message: error.message,
    retriable: error.retriable ?? false,
    stack: error.stack,
  }
}

/**
 * Get the wide event from the H3 event context
 * Useful when you need direct access to the event object
 */
export function getWideEvent(event: H3Event): WideEvent | undefined {
  return event.context.wideEvent
}

/**
 * Pick only allow-listed query parameters for logging.
 * Avoids logging sensitive or unbounded query data — only the named keys
 * (when present) are copied through.
 */
export function pickSafeQuery(
  query: Record<string, unknown>,
  allowList: readonly string[],
): Record<string, unknown> {
  const safe: Record<string, unknown> = {}
  for (const key of allowList) {
    if (key in query && query[key] !== undefined) {
      safe[key] = query[key]
    }
  }
  return safe
}

/**
 * Higher-order function to wrap database operations with timing
 * Usage: const result = await withDbTiming(event, 'users/123', 'read', async () => db.ref('users/123').once('value'))
 *
 * Tracks the operation on both success and failure (re-throws on error).
 */
export async function withDbTiming<T>(
  event: H3Event,
  ref: string,
  operationType: DbOpType,
  operation: () => Promise<T>,
): Promise<T> {
  const startTime = Date.now()
  try {
    const result = await operation()
    const { wideEvent } = event.context
    if (wideEvent)
      recordDbOp(wideEvent, operationType, ref, Date.now() - startTime)
    return result
  } catch (error) {
    // Still track the failed operation
    const { wideEvent } = event.context
    if (wideEvent)
      recordDbOp(wideEvent, operationType, ref, Date.now() - startTime)
    throw error
  }
}
