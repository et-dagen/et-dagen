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

  // Extract query parameters (sanitized)
  const query = getQuery(event)
  if (Object.keys(query).length > 0) {
    wideEvent.query = query as Record<string, unknown>
  }

  // Attach to event context so other middleware/handlers can enrich it
  event.context.wideEvent = wideEvent
  event.context.requestStartTime = startTime

  // Register response hook to capture final status and emit log
  event.node.res.on('finish', () => {
    const duration = Date.now() - startTime
    wideEvent.duration_ms = duration
    wideEvent.status_code = event.node.res.statusCode
    wideEvent.outcome = determineOutcome(event.node.res.statusCode)

    // Determine log level based on outcome
    const level =
      wideEvent.outcome === 'error'
        ? 'error'
        : wideEvent.outcome === 'client_error'
          ? 'warn'
          : 'info'

    logWideEvent(wideEvent, level)
  })
})

// Type augmentation for H3 event context
declare module 'h3' {
  interface H3EventContext {
    wideEvent: WideEvent
    requestStartTime: number
  }
}
