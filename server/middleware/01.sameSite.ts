/**
 * Refuses requests that change data when another website sent them
 *
 * Runs before authentication, so a forged request is refused before the cookie is ever read.
 */
import { createError, defineEventHandler, getHeader, getRequestHost } from 'h3'
import { refuseCrossSite } from '@/server/security/crossSite'
import { setErrorContext } from '@/server/utils/wideEventHelpers'

export default defineEventHandler((event) => {
  const refusal = refuseCrossSite({
    method: event.method,
    path: event.path,
    host: getRequestHost(event, { xForwardedHost: true }),
    headers: {
      origin: getHeader(event, 'origin'),
      secFetchSite: getHeader(event, 'sec-fetch-site'),
      contentType: getHeader(event, 'content-type'),
      contentLength: getHeader(event, 'content-length'),
    },
  })
  if (!refusal) return

  setErrorContext(event, {
    code: refusal.code,
    message:
      'Request that changes data came from another site or with a form body',
  })
  throw createError({
    statusCode: refusal.status,
    statusMessage: `Error (${refusal.code}).`,
  })
})
