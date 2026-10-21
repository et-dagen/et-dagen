import type { H3Event } from 'h3'
import { getRequestURL, send, setResponseHeaders, setResponseStatus } from 'h3'
import { defineNitroErrorHandler } from 'nitropack/runtime'
import { describeError, type ErrorReport } from './describe'

/**
 * The one place an error from a request is logged and turned into a response
 *
 * @remarks
 * Registered in front of Nuxt's error handler (see `nuxt.config.ts`). It records the error on the
 * request's wide event, and answers API requests itself. Page requests fall through to Nuxt, which
 * renders the error page.
 */
export default defineNitroErrorHandler((error, event) => {
  const report = describeError(error)
  recordOnWideEvent(event, report)

  if (!event.path.startsWith('/api/')) return

  setResponseStatus(event, report.status, report.statusMessage)
  setResponseHeaders(event, {
    'content-type': 'application/json',
    'cache-control': 'no-cache',
    'x-content-type-options': 'nosniff',
  })
  return send(
    event,
    JSON.stringify({
      error: true,
      url: getRequestURL(event).pathname,
      statusCode: report.status,
      statusMessage: report.statusMessage,
      message: report.message,
      code: report.code,
      request_id: event.context.wideEvent?.request_id,
      details: report.details,
    }),
  )
})

/**
 * Fill the wide event's error block
 *
 * @remarks
 * A v1 handler may already have described the error with `setErrorContext`. Its code and message
 * are kept, and only the causes and stack the handler could not see are added.
 */
function recordOnWideEvent(event: H3Event, report: ErrorReport): void {
  const { wideEvent } = event.context
  if (!wideEvent) return

  const stack = report.status >= 500 ? report.stack : undefined
  wideEvent.error = {
    type: report.type,
    code: report.code,
    message: report.message,
    retriable: report.retriable,
    details: report.details,
    ...wideEvent.error,
    ...(report.causes.length > 0 && { causes: report.causes }),
    stack: wideEvent.error?.stack ?? stack,
  }
}
