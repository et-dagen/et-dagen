/**
 * Wide-event logging middleware
 *
 * This middleware initializes the wide event context at the start of each request
 * and emits the final log at the end. Other middleware and handlers enrich the
 * event with context as the request progresses.
 *
 * Named with 00. prefix to ensure it runs first (Nuxt loads middleware alphabetically)
 */

import {
  createWideEvent,
  generateRequestId,
  logWideEvent,
  determineOutcome,
  type WideEvent,
} from '../utils/logger'
import { pickSafeQuery } from '../utils/wideEventHelpers'

// Query parameters safe to record in logs. Everything else is dropped.
const SAFE_QUERY_PARAMS = [
  'eventUID',
  'companyUID',
  'jobUID',
  'userUID',
  'programme',
  'year',
  'limit',
  'offset',
  'page',
] as const

export default defineEventHandler((event) => {
  const startTime = Date.now()

  // Generate request ID and set it on the response headers for tracing
  const requestId = generateRequestId()
  setHeader(event, 'X-Request-ID', requestId)

  // Check for incoming trace ID (for distributed tracing)
  const traceId = getHeader(event, 'X-Trace-ID')

  // Initialize the wide event
  const wideEvent = createWideEvent(requestId, event.method, event.path)

  if (traceId) {
    wideEvent.trace_id = traceId
  }

  // Extract query parameters (allow-listed to avoid logging sensitive data)
  const query = getQuery(event) as Record<string, unknown>
  const safeQuery = pickSafeQuery(query, SAFE_QUERY_PARAMS)
  if (Object.keys(safeQuery).length > 0) {
    wideEvent.query = safeQuery
  }

  // Attach to event context so other middleware/handlers can enrich it
  event.context.wideEvent = wideEvent
  event.context.requestStartTime = startTime

  // Emit exactly once — on normal completion ('finish') or abort ('close').
  let emitted = false
  const emit = () => {
    if (emitted) return
    emitted = true

    wideEvent.duration_ms = Date.now() - startTime
    wideEvent.status_code = event.node.res.statusCode

    let outcome = determineOutcome(event.node.res.statusCode)
    // Reconcile: a handler flagged an error but the status still reads success.
    if (outcome === 'success' && wideEvent.error) {
      outcome = 'client_error'
    }
    wideEvent.outcome = outcome

    // Determine log level based on outcome
    const level =
      outcome === 'error'
        ? 'error'
        : outcome === 'client_error'
          ? 'warn'
          : 'info'

    logWideEvent(wideEvent, level)
  }

  event.node.res.on('finish', emit)
  event.node.res.on('close', emit)
})

// Type augmentation for H3 event context
declare module 'h3' {
  interface H3EventContext {
    wideEvent: WideEvent
    requestStartTime: number
  }
}
